import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileItem, FileManagerProps, ALLOWED_FILE_TYPES, FileFilter, Folder, FileManagerState } from "./file-manager-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Copy,
  Trash2,
  Loader2,
  Upload,
  Eye,
  Search,
  FolderPlus,
  Grid,
  List,
  ChevronRight,
  MoreVertical,
  Video,
} from "lucide-react";

export function FileManager({ className, onFileSelect, allowMultiple = false }: FileManagerProps) {
  const [state, setState] = useState<FileManagerState>({
    selectedFiles: new Set(),
    currentFolder: null,
    filter: {},
    view: 'grid'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  // Query for folders
  const foldersQuery = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json() as Promise<Folder[]>;
    },
  });

  // Query for files with filters
  const filesQuery = useQuery({
    queryKey: ['files', state.currentFolder, state.filter],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (state.currentFolder) queryParams.append('folderId', state.currentFolder);
      if (state.filter.search) queryParams.append('search', state.filter.search);
      if (state.filter.type?.length) queryParams.append('types', state.filter.type.join(','));

      const response = await fetch(`/api/files?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json() as Promise<FileItem[]>;
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: state.currentFolder }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setNewFolderDialogOpen(false);
      setNewFolderName("");
      toast({ title: "Success", description: "Folder created successfully" });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, fileIds, targetFolderId }: { action: string; fileIds: string[]; targetFolderId?: string }) => {
      const response = await fetch('/api/files/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, fileIds, targetFolderId }),
      });
      if (!response.ok) throw new Error(`Failed to ${action} files`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setState(prev => ({ ...prev, selectedFiles: new Set() }));
      toast({ title: "Success", description: "Bulk action completed successfully" });
    },
  });

  const handleDragStart = (itemId: string) => {
    dragItem.current = itemId;
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    dragOverItem.current = folderId;
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    if (dragItem.current && dragItem.current !== targetFolderId) {
      await bulkActionMutation.mutateAsync({
        action: 'move',
        fileIds: [dragItem.current],
        targetFolderId,
      });
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setIsUploading(true);
      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          if (state.currentFolder) {
            formData.append('folderId', state.currentFolder);
          }

          const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Failed to upload file');
        }
        queryClient.invalidateQueries({ queryKey: ['files'] });
        toast({ title: "Success", description: "Files uploaded successfully" });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload files",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    accept: {
      'image/*': ALLOWED_FILE_TYPES.images,
      'text/*': ALLOWED_FILE_TYPES.documents,
      'video/*': ALLOWED_FILE_TYPES.videos,
    },
  });

  const renderBreadcrumb = () => {
    const currentPath = state.currentFolder
      ? foldersQuery.data?.find(f => f.id === state.currentFolder)
      : null;

    return (
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          onClick={() => setState(prev => ({ ...prev, currentFolder: null }))}
        >
          Root
        </Button>
        {currentPath && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span>{currentPath.name}</span>
          </>
        )}
      </div>
    );
  };

  const handleFileSelection = (fileId: string, checked: boolean) => {
    setState(prev => ({
      ...prev,
      selectedFiles: checked
        ? new Set([...Array.from(prev.selectedFiles), fileId])
        : new Set(Array.from(prev.selectedFiles).filter(id => id !== fileId))
    }));
  };

  const renderFileList = () => {
    if (filesQuery.isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    if (filesQuery.error) {
      return (
        <div className="text-center py-8 text-destructive">
          Failed to load files. Please try again.
        </div>
      );
    }

    return state.view === 'grid' ? (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filesQuery.data?.map((file) => (
          <Card
            key={file.id}
            className={`cursor-pointer ${state.selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''}`}
            draggable
            onDragStart={() => handleDragStart(file.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <Checkbox
                  checked={state.selectedFiles.has(file.id)}
                  onCheckedChange={(checked) => handleFileSelection(file.id, checked as boolean)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setSelectedFile(file);
                      setRenameDialogOpen(true);
                    }}>
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkActionMutation.mutate({
                      action: 'delete',
                      fileIds: [file.id]
                    })}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 text-center" onClick={() => onFileSelect?.(file)}>
                {file.type.startsWith('video/') ? (
                  <Video className="w-16 h-16 mx-auto text-muted-foreground" />
                ) : file.type.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-16 h-16 mx-auto bg-muted rounded-md flex items-center justify-center">
                    {file.type}
                  </div>
                )}
                <p className="mt-2 text-sm truncate">{file.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={filesQuery.data?.every(file => state.selectedFiles.has(file.id))}
                onCheckedChange={(checked) => {
                  setState(prev => ({
                    ...prev,
                    selectedFiles: checked
                      ? new Set(filesQuery.data?.map(f => f.id))
                      : new Set()
                  }));
                }}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filesQuery.data?.map((file) => (
            <TableRow
              key={file.id}
              draggable
              onDragStart={() => handleDragStart(file.id)}
            >
              <TableCell>
                <Checkbox
                  checked={state.selectedFiles.has(file.id)}
                  onCheckedChange={(checked) => handleFileSelection(file.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>{file.name}</TableCell>
              <TableCell>{file.type}</TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>{new Date(file.updatedAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    window.open(file.url, '_blank');
                    onFileSelect?.(file);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>File Manager</CardTitle>
          <CardDescription>
            Upload and manage your files. Supported formats: PNG, JPG, JPEG, SVG, GIF, TXT, CSV, JSON, MP4, WEBM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            {renderBreadcrumb()}
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setState(prev => ({
                    ...prev,
                    filter: { ...prev.filter, search: e.target.value }
                  }));
                }}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setState(prev => ({
                ...prev,
                view: prev.view === 'grid' ? 'list' : 'grid'
              }))}
            >
              {state.view === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <Button onClick={() => setNewFolderDialogOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <p>Uploading...</p>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p>Drag and drop files here, or click to select files</p>
              </div>
            )}
          </div>

          {state.selectedFiles.size > 0 && (
            <div className="mb-4 p-2 bg-muted rounded-lg flex items-center gap-2">
              <span>{state.selectedFiles.size} selected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to delete selected files?')) {
                    bulkActionMutation.mutate({
                      action: 'delete',
                      fileIds: Array.from(state.selectedFiles)
                    });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Implement move to folder functionality
                  // Show folder selection dialog
                }}
              >
                Move Selected
              </Button>
            </div>
          )}

          {renderFileList()}
        </CardContent>
      </Card>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="New file name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Implement rename functionality
              setRenameDialogOpen(false);
            }}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createFolderMutation.mutate(newFolderName)}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}