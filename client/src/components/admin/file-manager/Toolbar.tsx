import React, { useState } from 'react';
import { useFileManager } from './FileManagerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderPlus,
  Upload,
  Grid,
  List,
  RefreshCw,
  ChevronDown,
  FilePlus, 
  Trash2, 
  Copy, 
  ClipboardPaste, 
  Download,
  MoreHorizontal
} from 'lucide-react';

const Toolbar: React.FC = () => {
  const {
    createFolder,
    selectedItems,
    setViewMode,
    viewMode,
    refreshCurrentFolder,
    deleteFile,
    deleteFolder,
    downloadFile,
    moveItems
  } = useFileManager();
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  
  const hasSelection = selectedItems.length > 0;
  const onlyFilesSelected = selectedItems.every(item => 'url' in item);
  const onlyFoldersSelected = selectedItems.every(item => !('url' in item));
  
  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName);
      setNewFolderName('');
    }
    setIsNewFolderDialogOpen(false);
  };
  
  const handleDeleteSelected = async () => {
    const fileItems = selectedItems.filter(item => 'url' in item);
    const folderItems = selectedItems.filter(item => !('url' in item));
    
    // Delete files
    for (const file of fileItems) {
      await deleteFile(file.id);
    }
    
    // Delete folders
    for (const folder of folderItems) {
      await deleteFolder(folder.id);
    }
    
    setIsConfirmDeleteOpen(false);
  };
  
  const handleDownloadSelected = () => {
    const fileItems = selectedItems.filter(item => 'url' in item);
    for (const file of fileItems) {
      downloadFile(file.id);
    }
  };
  
  return (
    <div className="flex items-center justify-between gap-2 pb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsNewFolderDialogOpen(true)}
        >
          <FolderPlus className="h-4 w-4 mr-1.5" />
          New Folder
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={refreshCurrentFolder}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        {/* Actions for selected items */}
        {hasSelection && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {onlyFilesSelected && (
                <DropdownMenuItem onClick={handleDownloadSelected}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => setIsConfirmDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
              
              {/* Add more actions as needed */}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Select
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'grid' | 'list')}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">
              <div className="flex items-center">
                <Grid className="h-4 w-4 mr-2" />
                Grid View
              </div>
            </SelectItem>
            <SelectItem value="list">
              <div className="flex items-center">
                <List className="h-4 w-4 mr-2" />
                List View
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* New Folder Dialog */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name"
            className="my-4"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Items</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete {selectedItems.length} item(s)? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Toolbar;