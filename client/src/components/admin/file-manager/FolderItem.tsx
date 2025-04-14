import React from 'react';
import { Folder } from './types';
import { useFileManager } from './FileManagerContext';
import { cn } from '@/lib/utils';
import { Folder as FolderIcon, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface FolderItemProps {
  folder: Folder;
  isDragging?: boolean;
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, isDragging = false }) => {
  const { navigateToFolder, selectedItems, toggleItemSelection, deleteFolder, renameFolder } = useFileManager();
  
  const isSelected = selectedItems.some(item => item.id === folder.id);
  
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      toggleItemSelection(folder);
    } else {
      navigateToFolder(folder.id);
    }
  };
  
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItemSelection(folder);
  };
  
  return (
    <div 
      className={cn(
        'relative p-3 rounded-md hover:bg-muted cursor-pointer select-none border transition-colors',
        isSelected ? 'border-primary bg-primary/10' : 'border-transparent',
        isDragging ? 'opacity-50' : 'opacity-100',
      )}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 flex items-center justify-center text-primary">
          <FolderIcon className="w-10 h-10" />
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
              const newName = prompt('Enter new folder name', folder.name);
              if (newName && newName !== folder.name) {
                renameFolder(folder.id, newName);
              }
            }}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${folder.name}"? This will delete all files inside this folder.`)) {
                  deleteFolder(folder.id);
                }
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default FolderItem;