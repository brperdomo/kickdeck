import React, { useState, forwardRef } from 'react';
import { Folder } from './types';
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
import { Folder as FolderIcon, MoreVertical, Edit, Trash2, Share2, Info } from 'lucide-react';

interface FolderItemProps {
  folder: Folder;
  isDragging?: boolean;
}

const FolderItem = forwardRef<HTMLDivElement, FolderItemProps>(
  ({ folder, isDragging }, ref) => {
    const { 
      navigateToFolder, 
      renameFolder, 
      deleteFolder, 
      toggleFolderSelection, 
      selectedItems 
    } = useFileManager();
    
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState(folder.name);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const isSelected = selectedItems.some(item => !('url' in item) && item.id === folder.id);
    
    const handleDoubleClick = () => {
      navigateToFolder(folder.id);
    };
    
    const handleClick = (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        toggleFolderSelection(folder);
      } else {
        // Single click behavior - select only this item
        toggleFolderSelection(folder);
      }
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
              aria-label={`Folder: ${folder.name}`}
            >
              <div className="relative">
                <FolderIcon className="h-16 w-16 text-yellow-500" />
              </div>
              <span className="mt-2 text-sm font-medium text-center truncate w-full">
                {folder.name}
              </span>
            </div>
          </ContextMenuTrigger>
          
          <ContextMenuContent className="w-56">
            <ContextMenuItem onClick={handleDoubleClick}>
              Open
              <ContextMenuShortcut>⏎</ContextMenuShortcut>
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
              Are you sure you want to delete <strong>{folder.name}</strong>? This action cannot be undone.
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