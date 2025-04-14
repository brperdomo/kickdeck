import React, { useEffect, forwardRef } from 'react';
import { Folder, DragItem } from './types';
import { useFileManager } from './FileManagerContext';
import { cn } from '@/lib/utils';
import { Folder as FolderIcon, MoreHorizontal, ArrowUpDown } from 'lucide-react';
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
    
    // Set up drag and drop for folders
    const [{ isDragging }, dragRef, dragPreview] = useDrag({
      type: 'folder',
      item: (): DragItem => {
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
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        if (setIsDraggingOver) {
          setIsDraggingOver(false);
        }
      }
    });
    
    // Set up drop target for folders
    const [{ isOver }, dropRef] = useDrop({
      accept: ['file', 'folder'],
      drop: (item: DragItem) => {
        // When items are dropped on this folder, move them into it
        const itemIds = selectedItems.map(item => item.id);
        if (itemIds.length > 0) {
          moveItems(itemIds, folder.id);
        }
      },
      collect: monitor => ({
        isOver: monitor.isOver()
      })
    });
    
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
      // Apply the drag ref
      dragRef(element);
      
      // Apply the drop ref for dropping files/folders into this folder
      dropRef(element);
      
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
        <div 
          ref={combinedRef}
          className={cn(
            'relative p-3 rounded-md cursor-pointer select-none border transition-all duration-200 group',
            isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted',
            isDragging || externalIsDragging ? 'opacity-50 scale-95' : 'opacity-100',
            isOver ? 'ring-2 ring-primary/70 bg-primary/10' : '',
          )}
          onClick={handleClick}
          onContextMenu={handleRightClick}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="relative w-12 h-12 flex items-center justify-center text-primary">
              <FolderIcon className="w-10 h-10" />
              
              {/* Drag handle indicator - visible on hover or when selected */}
              <div className={`absolute -top-2 -left-2 bg-primary/20 rounded-full p-0.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <ArrowUpDown className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-sm font-medium truncate max-w-full">{folder.name}</div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(folder.updatedAt), { addSuffix: true })}
            </div>
          </div>
          
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setIsRenameDialogOpen(true);
                }}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Drag Preview - Hidden by default, used for custom drag preview */}
        <div ref={dragPreview} className="hidden">
          <div className="flex items-center bg-background border rounded-md shadow-md p-2">
            <FolderIcon className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-medium">{folder.name}</span>
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