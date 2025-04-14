import React, { useState, forwardRef, useEffect } from 'react';
import { File, DragItem } from './types';
import { useFileManager } from './FileManagerContext';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator, 
  ContextMenuShortcut, 
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  FileIcon, MoreVertical, Edit, Trash2, Download, Share2, Star, Info,
  Music, Video, Image, FileText, File as FileIconGeneric, FileCode, ArrowUpDown, 
  Star as StarIcon
} from 'lucide-react';
import { useDrag } from 'react-dnd';

interface FileItemProps {
  file: File;
  isDragging?: boolean;
}

const FileItem = forwardRef<HTMLDivElement, FileItemProps>(
  ({ file, isDragging: externalIsDragging }, ref) => {
    const { 
      downloadFile, 
      renameFile, 
      deleteFile, 
      toggleFileSelection, 
      toggleFavorite,
      selectedItems,
      setIsDraggingOver
    } = useFileManager();
    
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState(file.name);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const isSelected = selectedItems.some(item => 'url' in item && item.id === file.id);
    
    // Set up drag and drop
    const [{ isDragging }, dragRef, dragPreview] = useDrag({
      type: 'file',
      item: (): DragItem => {
        // If this file is not in the selected items and it's being dragged,
        // select it first
        if (!isSelected) {
          // Select only this file (clear other selections)
          const hasSelection = selectedItems.length > 0;
          if (hasSelection) {
            toggleFileSelection(file);
          } else {
            toggleFileSelection(file);
          }
        }
        
        // Return the file data for the drag preview
        return { 
          type: 'file',
          id: file.id,
          name: file.name
        };
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        if (setIsDraggingOver) {
          setIsDraggingOver(false);
        }
      }
    });
    
    // Update external dragging state
    useEffect(() => {
      if (isDragging && setIsDraggingOver) {
        setIsDraggingOver(true);
      }
    }, [isDragging, setIsDraggingOver]);
    
    const getFileIcon = () => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (file.type?.startsWith('image/')) {
        return file.thumbnailUrl ? (
          <div className="h-16 w-16 bg-cover bg-center rounded" style={{ backgroundImage: `url(${file.thumbnailUrl})` }} />
        ) : <Image className="h-16 w-16 text-blue-500" />;
      }
      
      if (file.type?.startsWith('audio/')) {
        return <Music className="h-16 w-16 text-purple-500" />;
      }
      
      if (file.type?.startsWith('video/')) {
        return <Video className="h-16 w-16 text-red-500" />;
      }
      
      if (extension === 'pdf') {
        return <FileText className="h-16 w-16 text-red-700" />;
      }
      
      if (['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml'].includes(extension || '')) {
        return <FileCode className="h-16 w-16 text-green-600" />;
      }
      
      if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
        return <FileText className="h-16 w-16 text-blue-700" />;
      }
      
      return <FileIconGeneric className="h-16 w-16 text-gray-500" />;
    };
    
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
      else return (bytes / 1073741824).toFixed(1) + ' GB';
    };
    
    const handleDoubleClick = () => {
      downloadFile(file.id);
    };
    
    const handleClick = (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        toggleFileSelection(file);
      } else if (!isSelected) {
        // Single click behavior - select only this item
        toggleFileSelection(file);
      } else {
        // File is already selected, don't deselect on single click
        // allowing multi-drag operations to work smoothly
      }
    };
    
    const handleRename = async () => {
      if (newName.trim() && newName !== file.name) {
        await renameFile(file.id, newName);
      }
      setIsRenameDialogOpen(false);
    };
    
    const handleDelete = async () => {
      await deleteFile(file.id);
      setIsDeleteDialogOpen(false);
    };
    
    const handleToggleFavorite = async () => {
      await toggleFavorite(file.id);
    };

    // Combine refs
    const combinedRef = (element: HTMLDivElement) => {
      // Apply the dragRef
      dragRef(element);
      
      // Apply the forwarded ref
      if (ref) {
        if (typeof ref === 'function') {
          ref(element);
        } else {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
        }
      }
    };
    
    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger>
            <div 
              ref={combinedRef}
              className={`
                relative flex flex-col items-center p-3 rounded-md cursor-pointer
                transition-all duration-200 group
                ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted'}
                ${isDragging || externalIsDragging ? 'opacity-50 scale-95' : 'opacity-100'}
              `}
              onClick={handleClick}
              onDoubleClick={handleDoubleClick}
              aria-label={`File: ${file.name}`}
            >
              <div className="relative">
                {getFileIcon()}
                {file.isFavorite && (
                  <div className="absolute -top-2 -right-2 text-yellow-500">
                    <StarIcon className="h-5 w-5 fill-current" />
                  </div>
                )}
                
                {/* Drag handle indicator - visible on hover or when selected */}
                <div className={`absolute -top-2 -left-2 bg-primary/20 rounded-full p-0.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </div>
              </div>
              <span className="mt-2 text-sm font-medium text-center truncate w-full">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            </div>
          </ContextMenuTrigger>
          
          <ContextMenuContent className="w-56">
            <ContextMenuItem onClick={handleDoubleClick}>
              Open
              <ContextMenuShortcut>⏎</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => downloadFile(file.id)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => setIsRenameDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
            <ContextMenuItem onClick={handleToggleFavorite}>
              <Star className={`mr-2 h-4 w-4 ${file.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              {file.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </ContextMenuItem>
            <ContextMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Info className="mr-2 h-4 w-4" />
              Properties
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        
        {/* Drag Preview - Hidden by default, used for custom drag preview */}
        <div ref={dragPreview} className="hidden">
          <div className="flex items-center bg-background border rounded-md shadow-md p-2">
            {getFileIcon()}
            <span className="ml-2 text-sm font-medium">{file.name}</span>
          </div>
        </div>
        
        {/* Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename File</DialogTitle>
            </DialogHeader>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter file name"
              className="my-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRename}>
                Rename
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete File</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to delete <strong>{file.name}</strong>? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

FileItem.displayName = 'FileItem';

export default FileItem;