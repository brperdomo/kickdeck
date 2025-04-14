import React, { useEffect, forwardRef, useRef } from 'react';
import { Folder, DragItem } from './types';
import { useFileManager } from './FileManagerContext';
import { cn } from '@/lib/utils';
import { 
  Folder as FolderIcon, 
  MoreHorizontal, 
  ArrowUpDown, 
  FolderPlus, 
  Check, 
  X,
  AlertCircle,
  FolderOpen,
  PlusCircle,
  BadgePlus,
  Share,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { useDrag, useDrop } from 'react-dnd';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FolderItemProps {
  folder: Folder;
  isDragging?: boolean;
}

const FolderItem = forwardRef<HTMLDivElement, FolderItemProps>(
  ({ folder, isDragging: externalIsDragging }, ref) => {
    const { 
      navigateToFolder, 
      selectedItems, 
      toggleItemSelection, 
      deleteFolder, 
      renameFolder,
      setIsDraggingOver,
      moveItems
    } = useFileManager();
    
    const isSelected = selectedItems.some(item => !('url' in item) && item.id === folder.id);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newName, setNewName] = useState(folder.name);
    const [didJustDrop, setDidJustDrop] = useState(false);
    const [dropError, setDropError] = useState(false);
    const [dropCount, setDropCount] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Set up drag and drop for folders
    const [{ isDragging }, dragRef, dragPreview] = useDrag({
      type: 'folder',
      item: (): DragItem => {
        console.log('Starting drag for folder:', folder.name);
        // If this folder is not in the selected items and it's being dragged,
        // select it first
        if (!isSelected) {
          // Select only this folder (clear other selections)
          const hasSelection = selectedItems.length > 0;
          if (hasSelection) {
            toggleItemSelection(folder);
          } else {
            toggleItemSelection(folder);
          }
        }
        
        // Return the folder data for the drag preview
        return { 
          type: 'folder',
          id: folder.id,
          name: folder.name
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
      end: (item, monitor) => {
        if (setIsDraggingOver) {
          setIsDraggingOver(false);
        }
      }
    });
    
    // Set up drop target for folders - allow dropping files/folders into this folder
    const [{ isOver, canDrop }, dropRef] = useDrop({
      accept: ['file', 'folder'],
      canDrop: (item: DragItem) => {
        console.log('Checking if can drop:', item, 'onto folder:', folder.id);
        
        // Prevent dropping a folder into itself
        if (item.type === 'folder' && item.id === folder.id) {
          console.log('Cannot drop folder onto itself');
          return false;
        }
        
        // Prevent dropping a folder into itself if it's part of the selected items
        const isCurrentFolderSelected = selectedItems.some(selectedItem => 
            !('url' in selectedItem) && selectedItem.id === folder.id);
            
        if (isCurrentFolderSelected) {
          console.log('Target folder is in selected items, cannot drop');
          return false;
        }
        
        // Always allow dropping files
        if (item.type === 'file') {
          console.log('Can drop file onto folder');
          return true;
        }
        
        // Allow dropping folders as long as they're not the current folder
        console.log('Can drop folder onto target folder');
        return true;
      },
      hover: (item, monitor) => {
        // This triggers when dragging over the folder
        if (monitor.isOver({ shallow: true })) {
          console.log('Hovering over folder:', folder.name);
        }
      },
      drop: async (item: DragItem, monitor) => {
        console.log('Drop detected on folder:', folder.name, 'Item:', item);
        
        // Only handle if this is the drop target (not a child component)
        if (!monitor.didDrop()) {
          console.log('Processing drop on folder:', folder.name);
          try {
            // Determine which items to move
            let itemsToMove: string[] = [];
            
            // If there are selected items and the dragged item is one of them,
            // move all selected items
            if (selectedItems.length > 0 && 
                selectedItems.some(selected => selected.id === item.id)) {
              itemsToMove = selectedItems.map(item => item.id);
              console.log('Moving selected items:', itemsToMove, 'to folder:', folder.id);
            } else {
              // Otherwise just move the dragged item
              itemsToMove = [item.id];
              console.log('Moving single item:', item.id, 'to folder:', folder.id);
            }
            
            // Filter out items that shouldn't be moved
            // 1. Prevent moving a folder into itself
            if (item.type === 'folder') {
              const previousItemsCount = itemsToMove.length;
              itemsToMove = itemsToMove.filter(id => id !== folder.id);
              
              if (previousItemsCount !== itemsToMove.length) {
                console.log('Removed target folder from items to move');
              }
            }
            
            if (itemsToMove.length === 0) {
              console.log('No valid items to move');
              return { moved: false, targetFolder: folder.id };
            }
            
            // Perform the move operation
            const result = await moveItems(itemsToMove, folder.id);
            console.log('Move operation result:', result);
            
            // Enhanced result checking - the moveItems function now returns detailed information
            if (result && result.moved) {
              // Show success feedback
              setDidJustDrop(true);
              setDropCount(prev => prev + 1);
              
              // Clear any existing timer
              if (timerRef.current) {
                clearTimeout(timerRef.current);
              }
              
              // Set a new timer
              timerRef.current = setTimeout(() => {
                setDidJustDrop(false);
                timerRef.current = null;
              }, 2000);
              
              console.log('Items moved successfully to folder:', folder.name);
              
              // Return the enhanced result with target folder info
              return { 
                ...result, 
                targetFolder: folder.id 
              };
            } else {
              console.log('Move operation returned non-success result:', result);
              return result; // Return the original result with error info if present
            }
          } catch (error) {
            console.error('Error moving items:', error);
            setDropError(true);
            setTimeout(() => setDropError(false), 2000);
            return { moved: false, error: true };
          }
        } else {
          console.log('Drop already handled by a child component');
          return { moved: false, handled: true };
        }
      },
      collect: monitor => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop()
      })
    });
    
    // Cancel the timer when the component unmounts
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
    
    const handleClick = (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        toggleItemSelection(folder);
      } else if (!isSelected) {
        navigateToFolder(folder.id);
      } else {
        // Folder is already selected, just navigate
        navigateToFolder(folder.id);
      }
    };
    
    const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      toggleItemSelection(folder);
    };
    
    const handleRename = async () => {
      if (newName.trim() && newName !== folder.name) {
        await renameFolder(folder.id, newName);
      }
      setIsRenameDialogOpen(false);
    };
    
    const handleDelete = async () => {
      await deleteFolder(folder.id);
      setIsDeleteDialogOpen(false);
    };
    
    // Combine all the refs
    const combinedRef = (element: HTMLDivElement) => {
      if (element) {
        // Apply the drag ref
        dragRef(element);
        console.log('Applied drag ref to folder element:', element);
        
        // Apply the drop ref for dropping files/folders into this folder
        dropRef(element);
        console.log('Applied drop ref to folder element:', element);
        
        // Apply the forwarded ref
        if (ref) {
          if (typeof ref === 'function') {
            ref(element);
          } else {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
          }
        }
      } else {
        console.log('Failed to apply drag/drop refs to folder element - element is null');
      }
    };
    
    const showDropIndicator = isOver && canDrop;
    const showInvalidDropIndicator = isOver && !canDrop;
    
    return (
      <>
        <div 
          ref={combinedRef}
          className={cn(
            'relative p-3 rounded-md cursor-pointer select-none border transition-all duration-200 group',
            isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted',
            isDragging || externalIsDragging ? 'opacity-50 scale-95 border-dashed border-primary/50' : 'opacity-100',
            showDropIndicator ? 'ring-2 ring-primary/70 bg-primary/10' : '',
            showInvalidDropIndicator ? 'ring-2 ring-destructive/70 bg-destructive/10' : '',
            didJustDrop ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20' : '',
          )}
          onClick={handleClick}
          onContextMenu={handleRightClick}
          aria-label={`Folder: ${folder.name}`}
        >
          {/* Drop indicator overlay - only shown when actively dropping */}
          <AnimatePresence>
            {showDropIndicator && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
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
                  className="bg-card/90 p-3 px-4 rounded-md shadow-sm flex flex-col items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <FolderOpen className="h-10 w-10 text-primary" />
                  </motion.div>
                  <div className="flex flex-col items-center">
                    <motion.p 
                      className="text-sm font-medium"
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Drop in folder
                    </motion.p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      <span className="font-semibold text-primary">{folder.name}</span>
                    </p>
                  </div>
                  <motion.div 
                    className="flex items-center gap-1 mt-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                    animate={{ scale: [1, 1.03, 1], opacity: [0.9, 1, 0.9] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <BadgePlus className="h-3 w-3" />
                    <span>Add {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
            
            {/* Invalid drop indicator */}
            {showInvalidDropIndicator && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-destructive/5 backdrop-blur-[1px] rounded-md z-10 pointer-events-none 
                            flex items-center justify-center"
              >
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1, rotate: [0, -1, 1, 0] }}
                  transition={{ type: "spring", stiffness: 400, rotate: { repeat: Infinity, duration: 0.3 } }}
                  className="bg-card/90 p-2 px-3 rounded shadow-sm text-sm font-medium text-destructive flex flex-col items-center gap-2"
                >
                  <X className="h-8 w-8" />
                  <span>Cannot move here</span>
                  <p className="text-xs text-muted-foreground">Items cannot be moved into themselves</p>
                </motion.div>
              </motion.div>
            )}
            
            {/* Success indicator after drop */}
            {didJustDrop && (
              <motion.div 
                key={`success-${dropCount}`}
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
                    <Check className="h-5 w-5" />
                  </motion.div>
                  <span className="font-medium">
                    {selectedItems.length > 1 
                      ? `${selectedItems.length} items added` 
                      : 'Item added'}
                  </span>
                </motion.div>
              </motion.div>
            )}
            
            {/* Error indicator */}
            {dropError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-destructive/10 backdrop-blur-[1px] rounded-md z-10 
                           flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="bg-destructive text-white py-2 px-3 rounded-md shadow-lg flex items-center gap-2"
                >
                  <AlertCircle className="h-5 w-5" />
                  <span>Error moving items</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex flex-col items-center text-center gap-2 relative">
            <motion.div 
              className="relative w-12 h-12 flex items-center justify-center text-primary"
              animate={didJustDrop ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                whileHover={{ rotate: [-1, 1, -1] }}
                transition={{ duration: 0.3, repeat: 2 }}
              >
                {isDragging ? (
                  <FolderOpen className="w-10 h-10" />
                ) : (
                  <FolderIcon className="w-10 h-10" />
                )}
              </motion.div>
              
              {/* Drag handle indicator - visible on hover or when selected */}
              <motion.div 
                className={`absolute -top-2 -left-2 bg-primary/20 rounded-full p-0.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
              </motion.div>
              
              {/* File count badge - if we had this data */}
              {/* <div className="absolute -bottom-1 -right-1 bg-primary/20 text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">
                <span>3</span>
              </div> */}
            </motion.div>
            
            <motion.div 
              className="text-sm font-medium truncate max-w-full"
              animate={didJustDrop ? { color: 'var(--green-600)' } : {}}
              transition={{ duration: 0.3 }}
            >
              {folder.name}
            </motion.div>
            
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(folder.updatedAt), { addSuffix: true })}
            </div>
          </div>
          
          <motion.div 
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <motion.button 
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  navigateToFolder(folder.id);
                }}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setIsRenameDialogOpen(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  // Could implement share functionality here
                }}>
                  <Share className="mr-2 h-4 w-4" />
                  Share folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
        
        {/* Drag Preview - Hidden by default, used for custom drag preview */}
        <div ref={dragPreview} className="hidden">
          <div className="flex items-center bg-background border rounded-md shadow-md p-2">
            <FolderIcon className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-medium">{folder.name}</span>
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
              <DialogTitle>Rename Folder</DialogTitle>
            </DialogHeader>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter folder name"
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
              <DialogTitle>Delete Folder</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to delete <strong>{folder.name}</strong>? This will delete all files and subfolders inside this folder. This action cannot be undone.
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

FolderItem.displayName = 'FolderItem';

export default FolderItem;