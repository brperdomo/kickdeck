import React, { useState, forwardRef, useEffect, useRef } from 'react';
import { File, DragItem } from './types';
import { useFileManager } from './FileManagerContext';
import { cn } from '@/lib/utils';
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
  Star as StarIcon, MoveRight, CheckCircle, AlertCircle, Copy, ExternalLink,
  Zap, Eye
} from 'lucide-react';
import { useDrag } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [didJustMove, setDidJustMove] = useState(false);
    const [moveCount, setMoveCount] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    const isSelected = selectedItems.some(item => 'url' in item && item.id === file.id);
    
    // Set up drag and drop
    const [{ isDragging }, dragRef, dragPreview] = useDrag({
      type: 'file',
      item: (): DragItem => {
        console.log('Starting drag for file:', file.name, 'File ID:', file.id);
        // If this file is not in the selected items and it's being dragged,
        // select it first (but don't clear other selections if using Ctrl/Cmd key)
        if (!isSelected) {
          console.log('File not selected, selecting it now');
          toggleFileSelection(file);
        } else {
          console.log('File already selected, proceeding with drag');
        }
        
        // Return the file data for the drag preview
        return { 
          type: 'file',
          id: file.id,
          name: file.name,
          size: file.size,
          isSelected: isSelected // Pass the selection state
        };
      },
      options: {
        // These settings make dragging more responsive
        // Lower delay/threshold makes it easier to start dragging
        dragPreviewOptions: {
          offsetX: 10,
          offsetY: 10,
        },
        // NOTE: These are custom options not in the type definition but supported by react-dnd
        // @ts-ignore - touchStartThreshold is supported but not in TypeScript defs
        touchStartThreshold: 5,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: () => {
        // Files can always be dragged
        return true;
      },
      isDragging: (monitor) => {
        // Custom check to determine if we're dragging this specific item
        // This is needed because we might be dragging multiple items at once
        const item = monitor.getItem();
        const isThisItemDragging = item.id === file.id;
        
        // Also check if this item is part of the multiple selected items being dragged
        const isPartOfMultipleDrag = selectedItems.some(selectedItem => 
          'url' in selectedItem && selectedItem.id === file.id);
        
        return isThisItemDragging || isPartOfMultipleDrag;
      },
      end: (item, monitor) => {
        console.log('Drag ended for file', file.name);
        if (setIsDraggingOver) {
          setIsDraggingOver(false);
        }
        
        // Show a success indicator if the drop was successful
        const dropResult = monitor.getDropResult();
        if (monitor.didDrop() && dropResult) {
          console.log('File dropped successfully:', file.name, 'Drop result:', dropResult);
          
          // Check if the drop result contains information indicating this file was moved
          const wasItemMoved = dropResult.itemsMoved && 
            Array.isArray(dropResult.itemsMoved) && 
            dropResult.itemsMoved.includes(file.id);
            
          // Also check using movedFileIds from the enhanced moveItems return value
          const wasMovedInFileIds = dropResult.movedFileIds && 
            Array.isArray(dropResult.movedFileIds) && 
            dropResult.movedFileIds.includes(file.id);
            
          if (dropResult.moved === true || wasItemMoved || wasMovedInFileIds) {
            console.log('Showing move success indicator for file:', file.name);
            setDidJustMove(true);
            setMoveCount(prev => prev + 1);
            
            // Clear any existing timer
            if (timerRef.current) {
              clearTimeout(timerRef.current);
            }
            
            // Set a new timer
            timerRef.current = setTimeout(() => {
              setDidJustMove(false);
              timerRef.current = null;
            }, 2000);
          }
        } else {
          console.log('Drop was not successful or drop result is missing');
        }
      }
    });
    
    // Clean up timer on unmount
    useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, []);
    
    // Update external dragging state
    useEffect(() => {
      if (isDragging && setIsDraggingOver) {
        setIsDraggingOver(true);
      }
    }, [isDragging, setIsDraggingOver]);
    
    const isImage = file.type?.startsWith('image/');
    
    const getFileIcon = () => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (isImage) {
        return file.thumbnailUrl ? (
          <div className="h-16 w-16 bg-cover bg-center rounded transition-transform" style={{ backgroundImage: `url(${file.thumbnailUrl})` }} />
        ) : <Image className="h-16 w-16 text-blue-500 transition-transform" />;
      }
      
      if (file.type?.startsWith('audio/')) {
        return <Music className="h-16 w-16 text-purple-500 transition-transform" />;
      }
      
      if (file.type?.startsWith('video/')) {
        return <Video className="h-16 w-16 text-red-500 transition-transform" />;
      }
      
      if (extension === 'pdf') {
        return <FileText className="h-16 w-16 text-red-700 transition-transform" />;
      }
      
      if (['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml'].includes(extension || '')) {
        return <FileCode className="h-16 w-16 text-green-600 transition-transform" />;
      }
      
      if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
        return <FileText className="h-16 w-16 text-blue-700 transition-transform" />;
      }
      
      return <FileIconGeneric className="h-16 w-16 text-gray-500 transition-transform" />;
    };
    
    // Get smaller version of icon for previews
    const getSmallFileIcon = () => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (isImage) {
        return file.thumbnailUrl ? (
          <div className="h-5 w-5 bg-cover bg-center rounded" style={{ backgroundImage: `url(${file.thumbnailUrl})` }} />
        ) : <Image className="h-5 w-5 text-blue-500" />;
      }
      
      if (file.type?.startsWith('audio/')) {
        return <Music className="h-5 w-5 text-purple-500" />;
      }
      
      if (file.type?.startsWith('video/')) {
        return <Video className="h-5 w-5 text-red-500" />;
      }
      
      if (extension === 'pdf') {
        return <FileText className="h-5 w-5 text-red-700" />;
      }
      
      if (['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml'].includes(extension || '')) {
        return <FileCode className="h-5 w-5 text-green-600" />;
      }
      
      if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
        return <FileText className="h-5 w-5 text-blue-700" />;
      }
      
      return <FileIconGeneric className="h-5 w-5 text-gray-500" />;
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
      if (element) {
        // Apply the dragRef
        dragRef(element);
        
        console.log('Applied drag ref to file element:', element);
        
        // Apply the forwarded ref
        if (ref) {
          if (typeof ref === 'function') {
            ref(element);
          } else {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
          }
        }
      } else {
        console.log('Failed to apply drag ref to file element - element is null');
      }
    };
    
    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger>
            <motion.div 
              ref={combinedRef}
              className={cn(
                "relative flex flex-col items-center p-3 rounded-md cursor-pointer border",
                "transition-all duration-300 group",
                isSelected ? 'bg-primary/10 ring-2 ring-primary border-transparent' : 'hover:bg-muted border-transparent',
                isDragging || externalIsDragging ? 'opacity-50 scale-95 border-dashed border-primary/50' : 'opacity-100',
                didJustMove ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20' : '',
              )}
              onClick={handleClick}
              onDoubleClick={handleDoubleClick}
              whileHover={{ 
                scale: isSelected ? 1 : 1.02,
                transition: { duration: 0.2 }
              }}
              onMouseEnter={() => isImage && setShowPreview(true)}
              onMouseLeave={() => setShowPreview(false)}
              aria-label={`File: ${file.name}`}
            >
              <AnimatePresence>
                {isDragging && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] rounded-md z-10 pointer-events-none 
                              flex items-center justify-center"
                  >
                    <motion.div 
                      initial={{ y: 5 }}
                      animate={{ 
                        y: [5, 0, 0],
                        scale: [0.95, 1.02, 1]
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 25 
                      }}
                      className="bg-card/90 p-3 px-4 rounded-md shadow-md flex flex-col items-center gap-2"
                    >
                      <motion.div
                        animate={{ 
                          y: [0, -3, 0],
                          rotate: [0, -3, 3, 0] 
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        {getSmallFileIcon()}
                      </motion.div>
                      <p className="text-sm font-medium">
                        Moving {selectedItems.length > 1 ? `${selectedItems.length} files` : 'file'}
                      </p>
                    </motion.div>
                  </motion.div>
                )}
                
                {/* Success indicator after successful drop/move */}
                {didJustMove && (
                  <motion.div 
                    key={`success-${moveCount}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-green-500/10 backdrop-blur-[1px] rounded-md z-10 
                              flex items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      initial={{ y: 5 }}
                      animate={{ y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="bg-green-500 text-white py-2 px-3 rounded-md shadow-lg flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          rotate: [0, 10, 0]
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </motion.div>
                      <span className="font-medium">File moved</span>
                    </motion.div>
                  </motion.div>
                )}
                
                {/* Image preview tooltip */}
                {showPreview && isImage && file.url && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-2 transform translate-y-full z-50 bg-card rounded-md shadow-xl p-2 border"
                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                  >
                    <div className="relative">
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        className="max-w-full max-h-[150px] object-contain rounded"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                        {file.name}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                className="relative"
                whileHover={{ 
                  rotate: [-1, 1, -1], 
                  transition: { duration: 0.3 } 
                }}
                animate={
                  didJustMove ? { scale: [1, 1.15, 1], transition: { duration: 0.5 } } : {}
                }
              >
                {getFileIcon()}
                {file.isFavorite && (
                  <motion.div 
                    className="absolute -top-2 -right-2 text-yellow-500"
                    animate={{ rotate: [0, 15, 0] }}
                    transition={{ duration: 2, repeat: didJustMove ? 1 : 0 }}
                  >
                    <StarIcon className="h-5 w-5 fill-current" />
                  </motion.div>
                )}
                
                {/* Drag handle indicator - visible on hover or when selected */}
                <motion.div 
                  className={`absolute -top-2 -left-2 bg-primary/20 rounded-full p-0.5 transition-opacity cursor-grab ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="mt-2 text-sm font-medium text-center truncate w-full relative group"
                animate={{ color: didJustMove ? 'var(--green-600)' : 'currentColor' }}
                transition={{ duration: 0.3 }}
              >
                {file.name}
                
                {/* Quick actions on hover */}
                <motion.div 
                  className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(file.id);
                    }}
                    className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </motion.div>
              </motion.div>
              
              <motion.div
                className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"
                animate={didJustMove ? { y: [0, -2, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <span>{formatFileSize(file.size)}</span>
              </motion.div>
            </motion.div>
          </ContextMenuTrigger>
          
          <ContextMenuContent className="w-56">
            <ContextMenuItem onClick={handleDoubleClick}>
              <Eye className="mr-2 h-4 w-4" />
              Open
              <ContextMenuShortcut>⏎</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => downloadFile(file.id)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigator.clipboard.writeText(file.url || '')}>
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => setIsRenameDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Rename
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
            <ContextMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
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
            <div className="h-5 w-5 shrink-0 mr-2">
              {getSmallFileIcon()}
            </div>
            <span className="text-sm font-medium">{file.name}</span>
            {selectedItems.length > 1 && (
              <span className="ml-2 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                +{selectedItems.length - 1}
              </span>
            )}
          </div>
        </div>
        
        {/* Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename File</DialogTitle>
            </DialogHeader>
            <div className="flex items-center space-x-2 my-4">
              {getSmallFileIcon()}
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter file name"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
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
            <div className="py-4">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="font-medium">Are you sure you want to delete this file?</p>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                {getSmallFileIcon()}
                <span className="font-medium">{file.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This action cannot be undone. The file will be permanently deleted.
              </p>
            </div>
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