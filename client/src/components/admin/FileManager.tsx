import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Folder,
  FileItem,
  FileManagerProps,
  FileManagerState,
  BulkAction,
  folderSchema,
  fileSchema,
} from './file-manager-types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import {
  FolderIcon,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  FilmIcon,
  Trash2Icon,
  DownloadIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  UploadIcon,
  GridIcon,
  ListIcon,
  MoreHorizontalIcon,
  FolderInputIcon,
  CopyIcon,
  ArrowLeftIcon,
  SearchIcon,
  CheckIcon,
  ExternalLinkIcon,
  ClipboardCopyIcon,
  MaximizeIcon
} from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function FileManager({ className, onFileSelect, allowMultiple = false }: FileManagerProps) {
  const { user } = useUser();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

  const [state, setState] = useState<FileManagerState>({
    selectedFiles: new Set<string>(),
    currentFolder: null,
    filter: {
      type: undefined,
      folderId: null,
    },
    view: 'grid',
  });

  // Create folder form
  const folderForm = useForm<{ name: string, parentId: string | null }>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: '',
      parentId: state.currentFolder,
    },
  });

  // Upload file form
  const uploadForm = useForm({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      name: '',
      file: undefined,
      folderId: state.currentFolder,
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.length) {
        uploadForm.setValue('file', acceptedFiles[0]);
        uploadForm.setValue('name', acceptedFiles[0].name);
      }
    },
  });

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      // Use the current folder as the folderId parameter
      if (state.currentFolder) {
        params.append('folderId', state.currentFolder);
      } else if (state.filter.folderId) {
        params.append('folderId', state.filter.folderId);
      }

      if (state.filter.type?.length) {
        state.filter.type.forEach(type => params.append('type', type));
      }
      if (state.filter.search) {
        params.append('search', state.filter.search);
      }

      const response = await fetch(`/api/files?${params.toString()}`);
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [state.filter]);

  const fetchFolders = useCallback(async () => {
    try {
      const parentId = state.currentFolder || 'root';
      const response = await fetch(`/api/folders?parentId=${parentId}`);
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    }
  }, [state.currentFolder]);

  const fetchBreadcrumbs = useCallback(async () => {
    if (!state.currentFolder) {
      setBreadcrumbs([]);
      return;
    }

    try {
      const response = await fetch(`/api/folders/breadcrumbs/${state.currentFolder}`);
      if (response.ok) {
        const data = await response.json();
        setBreadcrumbs(data);
      }
    } catch (error) {
      console.error('Error fetching breadcrumbs:', error);
    }
  }, [state.currentFolder]);

  // Load files and folders
  useEffect(() => {
    fetchFiles();
    fetchFolders();
    fetchBreadcrumbs();
  }, [fetchFiles, fetchFolders, fetchBreadcrumbs]);

  const navigateTo = (folderId: string | null) => {
    setState(prev => ({
      ...prev,
      currentFolder: folderId,
      selectedFiles: new Set(),
    }));
  };

  const toggleSelection = (fileId: string) => {
    setState(prev => {
      const newSelection = new Set(prev.selectedFiles);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        if (!allowMultiple) {
          newSelection.clear();
        }
        newSelection.add(fileId);
      }
      return {
        ...prev,
        selectedFiles: newSelection,
      };
    });
  };

  const handleCreateFolder = async (data: { name: string, parentId: string | null }) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          parentId: state.currentFolder,
        }),
      });

      if (response.ok) {
        toast.success('Folder created successfully');
        setIsCreateFolderOpen(false);
        folderForm.reset();
        fetchFolders();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('An error occurred while creating the folder');
    }
  };

  const handleFileUpload = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('name', data.name);
      if (state.currentFolder) {
        formData.append('folderId', state.currentFolder);
      }

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('File uploaded successfully');
        setIsUploadOpen(false);
        uploadForm.reset();
        fetchFiles();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('An error occurred while uploading the file');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('File deleted successfully');
        setState(prev => ({
          ...prev,
          selectedFiles: new Set([...prev.selectedFiles].filter(id => id !== fileId)),
        }));
        fetchFiles();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('An error occurred while deleting the file');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) {
      return;
    }

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Folder deleted successfully');
        fetchFolders();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('An error occurred while deleting the folder');
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    const selectedIds = Array.from(state.selectedFiles);
    if (selectedIds.length === 0) {
      toast.error('No files selected');
      return;
    }

    if (action === 'move') {
      setIsMoveFolderOpen(true);
      return;
    }

    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedIds.length} file(s)?`)) {
        return;
      }

      try {
        const response = await fetch('/api/files/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'delete',
            fileIds: selectedIds 
          }),
        });

        if (response.ok) {
          toast.success(`${selectedIds.length} file(s) deleted successfully`);
          setState(prev => ({
            ...prev,
            selectedFiles: new Set(),
          }));
          fetchFiles();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to delete files');
        }
      } catch (error) {
        console.error('Error performing bulk delete:', error);
        toast.error('An error occurred while deleting files');
      }
    }

    if (action === 'copy') {
      toast.info('Copy functionality coming soon');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6" />;
    }
    if (fileType.startsWith('video/')) {
      return <FilmIcon className="h-6 w-6" />;
    }
    if (fileType === 'application/pdf' || fileType.startsWith('text/')) {
      return <FileTextIcon className="h-6 w-6" />;
    }
    return <FileIcon className="h-6 w-6" />;
  };

  const handleFileClick = (file: FileItem) => {
    if (onFileSelect) {
      onFileSelect(file);
    } else {
      toggleSelection(file.id);
    }
  };
  
  // Function to copy file path to clipboard
  const copyPathToClipboard = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path)
      .then(() => {
        toast.success('Path copied to clipboard');
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        toast.error('Failed to copy path');
      });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setState(prev => ({
      ...prev,
      filter: {
        ...prev.filter,
        search: value,
      },
    }));
  };

  // Move files to folder
  const handleMoveToFolder = async () => {
    const selectedIds = Array.from(state.selectedFiles);
    if (!targetFolderId) {
      toast.error('Please select a target folder');
      return;
    }

    try {
      // Convert "root" to empty string for the API (representing root folder)
      const folderIdForApi = targetFolderId === 'root' ? '' : targetFolderId;
      
      const response = await fetch('/api/files/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'move',
          fileIds: selectedIds,
          targetFolderId: folderIdForApi
        }),
      });

      if (response.ok) {
        toast.success(`${selectedIds.length} file(s) moved successfully`);
        setIsMoveFolderOpen(false);
        setTargetFolderId(null);
        setState(prev => ({
          ...prev,
          selectedFiles: new Set(),
        }));
        fetchFiles();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to move files');
      }
    } catch (error) {
      console.error('Error moving files:', error);
      toast.error('An error occurred while moving files');
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Top toolbar */}
      <div className="flex justify-between items-center mb-4 p-2 bg-muted rounded-md">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo(null)}
            disabled={!state.currentFolder}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Root
          </Button>

          <div className="flex items-center space-x-1">
            {breadcrumbs.map((folder, index) => (
              <React.Fragment key={folder.id}>
                {index > 0 && <span>/</span>}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1"
                  onClick={() => navigateTo(folder.id)}
                >
                  {folder.name}
                </Button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <SearchIcon className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-8 w-48"
              value={state.filter.search || ''}
              onChange={handleSearch}
            />
          </div>

          <Button
            variant="outline" 
            size="sm"
            className={cn(state.view === 'grid' ? 'bg-accent' : '')}
            onClick={() => setState(prev => ({ ...prev, view: 'grid' }))}
          >
            <GridIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={cn(state.view === 'list' ? 'bg-accent' : '')}
            onClick={() => setState(prev => ({ ...prev, view: 'list' }))}
          >
            <ListIcon className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsCreateFolderOpen(true)}>
            <FolderPlusIcon className="h-4 w-4 mr-1" />
            New Folder
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>
            <UploadIcon className="h-4 w-4 mr-1" />
            Upload
          </Button>

          {state.selectedFiles.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontalIcon className="h-4 w-4 mr-1" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkAction('move')}>
                  <FolderInputIcon className="h-4 w-4 mr-2" />
                  Move to Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('copy')}>
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Main content area */}
      <ScrollArea className="flex-1">
        {/* Folders */}
        {folders.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2">Folders</h3>
            {state.view === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {folders.map(folder => (
                  <Card 
                    key={folder.id} 
                    className="hover:bg-muted cursor-pointer"
                  >
                    <CardContent className="p-3 flex items-center space-x-2">
                      <FolderIcon className="h-6 w-6 text-yellow-500" />
                      <span className="truncate flex-1" onClick={() => navigateTo(folder.id)}>
                        {folder.name}
                      </span>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folders.map(folder => (
                    <TableRow key={folder.id}>
                      <TableCell 
                        className="font-medium cursor-pointer"
                        onClick={() => navigateTo(folder.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <FolderIcon className="h-5 w-5 text-yellow-500" />
                          <span>{folder.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(folder.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteFolder(folder.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Files */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <p>Loading...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>No files found</p>
          </div>
        ) : (
          <div>
            <h3 className="font-medium text-sm mb-2">Files</h3>
            {state.view === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.map(file => (
                  <Card 
                    key={file.id} 
                    className={cn(
                      "cursor-pointer hover:bg-muted transition-colors",
                      state.selectedFiles.has(file.id) && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleFileClick(file)}
                  >
                    <CardContent className="p-3 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {file.type.startsWith('image/') && file.thumbnailUrl ? (
                            <div className="h-12 w-12 rounded overflow-hidden mr-2">
                              <img 
                                src={file.thumbnailUrl} 
                                alt={file.name} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="mr-2">{getFileIcon(file.type)}</div>
                          )}
                          {state.selectedFiles.has(file.id) && (
                            <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                              <CheckIcon className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="truncate text-sm" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatBytes(file.size)}
                      </div>
                      <div className="flex justify-between mt-2">
                        <div className="flex space-x-1">
                          <a 
                            href={file.url} 
                            download
                            onClick={(e) => e.stopPropagation()}
                            title="Download"
                          >
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <DownloadIcon className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <a 
                            href={file.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Preview in new tab"
                          >
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLinkIcon className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={(e) => copyPathToClipboard(file.url, e)}
                            title="Copy path"
                          >
                            <ClipboardCopyIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
                            title="Delete"
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map(file => (
                    <TableRow 
                      key={file.id}
                      className={cn(
                        state.selectedFiles.has(file.id) && "bg-primary/5"
                      )}
                      onClick={() => handleFileClick(file)}
                    >
                      <TableCell className="w-10">
                        {state.selectedFiles.has(file.id) && (
                          <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                            <CheckIcon className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {file.type.startsWith('image/') && file.thumbnailUrl ? (
                            <div className="h-8 w-8 rounded overflow-hidden">
                              <img 
                                src={file.thumbnailUrl} 
                                alt={file.name} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div>{getFileIcon(file.type)}</div>
                          )}
                          <span className="truncate max-w-[200px]">{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{file.type && file.type.includes('/') ? file.type.split('/')[1].toUpperCase() : (file.type || 'UNKNOWN')}</TableCell>
                      <TableCell>{formatBytes(file.size)}</TableCell>
                      <TableCell>{formatDate(file.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <a 
                            href={file.url} 
                            download
                            onClick={(e) => e.stopPropagation()}
                            title="Download"
                          >
                            <Button variant="ghost" size="icon">
                              <DownloadIcon className="h-4 w-4" />
                            </Button>
                          </a>
                          <a 
                            href={file.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Preview in new tab"
                          >
                            <Button variant="ghost" size="icon">
                              <ExternalLinkIcon className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => copyPathToClipboard(file.url, e)}
                            title="Copy path"
                          >
                            <ClipboardCopyIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
                            title="Delete"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Create folder dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Form {...folderForm}>
            <form onSubmit={folderForm.handleSubmit(handleCreateFolder)} className="space-y-4">
              <FormField
                control={folderForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter folder name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Create Folder</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Upload file dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <Form {...uploadForm}>
            <form onSubmit={uploadForm.handleSubmit(handleFileUpload)} className="space-y-4">
              <div 
                {...getRootProps()} 
                className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary"
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-2 text-center">
                  <UploadIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop a file here, or click to select a file
                  </p>
                </div>
              </div>

              {uploadForm.watch('file') && (
                <FormField
                  control={uploadForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={!uploadForm.watch('file')}
                >
                  Upload
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={isMoveFolderOpen} onOpenChange={setIsMoveFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Files to Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Select a folder to move {state.selectedFiles.size} file(s) to:</p>

            <Select onValueChange={(value) => setTargetFolderId(value)} value={targetFolderId || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No folder)</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMoveFolderOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleMoveToFolder}>
                Move Files
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}