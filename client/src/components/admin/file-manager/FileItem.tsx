import React, { useState, forwardRef } from 'react';
import { File } from './types';
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

interface FileItemProps {
  file: File;
  isDragging?: boolean;
}

const FileItem = forwardRef<HTMLDivElement, FileItemProps>(
  ({ file, isDragging }, ref) => {
    const { 
      downloadFile, 
      renameFile, 
      deleteFile, 
      toggleFileSelection, 
      toggleFavorite,
      selectedItems 
    } = useFileManager();
    
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState(file.name);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const isSelected = selectedItems.some(item => 'url' in item && item.id === file.id);
    
    const getFileIcon = () => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (file.type.startsWith('image/')) {
        return file.thumbnailUrl ? (
          <div className="h-16 w-16 bg-cover bg-center rounded" style={{ backgroundImage: `url(${file.thumbnailUrl})` }} />
        ) : <Image className="h-16 w-16 text-blue-500" />;
      }
      
      if (file.type.startsWith('audio/')) {
        return <Music className="h-16 w-16 text-purple-500" />;
      }
      
      if (file.type.startsWith('video/')) {
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
      } else {
        // Single click behavior - select only this item
        toggleFileSelection(file);
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
    
    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger>
            <div 
              ref={ref}
              className={`
                relative flex flex-col items-center p-3 rounded-md cursor-pointer
                transition-all duration-200 group
                ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted'}
                ${isDragging ? 'opacity-50' : 'opacity-100'}
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