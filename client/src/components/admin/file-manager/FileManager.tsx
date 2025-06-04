import React, { useState, useCallback } from 'react';
import { FileManagerProvider } from './FileManagerContext';
import { useFileManager } from './FileManagerContext';
import Breadcrumbs from './Breadcrumbs';
import Toolbar from './Toolbar';
import FileManagerContent from './FileManagerContent';
import FileUploader from './FileUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Separator } from "../../../components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useDropzone } from 'react-dropzone';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from "../../../lib/utils";
import { Upload, FolderPlus } from 'lucide-react';

// Internal component that has access to context
const FileManagerWithDnd: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const { uploadFiles, currentFolder, isDraggingOver } = useFileManager();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length) {
      uploadFiles(acceptedFiles as unknown as FileList, currentFolder?.id || null);
      // Switch to browse tab to see the uploaded files
      setActiveTab('browse');
    }
  }, [uploadFiles, currentFolder, setActiveTab]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true 
  });
  
  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-md transition-all duration-200",
        isDragActive && "outline-dashed outline-2 outline-primary bg-primary/5"
      )}
    >
      <input {...getInputProps()} />
      
      {/* Full-screen upload drop target overlay */}
      {isDragActive && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-primary/10 backdrop-blur-sm rounded-md">
          <div className="bg-card p-8 rounded-lg shadow-lg text-center">
            <div className="bg-primary/10 rounded-full p-4 mx-auto mb-4">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drop files here</h3>
            <p className="text-muted-foreground">
              Release to upload files to {currentFolder ? `"${currentFolder.name}"` : 'root folder'}
            </p>
          </div>
        </div>
      )}
      
      {/* Internal drag indicator - when moving files between folders */}
      {isDraggingOver && !isDragActive && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-4 right-4 bg-card p-3 rounded-lg shadow-lg text-center flex items-center space-x-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Drop to move selected items</span>
          </div>
        </div>
      )}
      
      <Card className={cn(
        "shadow-sm w-full transition-opacity duration-200", 
        (isDragActive || isDraggingOver) && "opacity-85"
      )}>
        <CardHeader className="pb-2">
          <CardTitle>File Manager</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="browse">Browse Files</TabsTrigger>
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse" className="space-y-4">
              <Breadcrumbs />
              <Separator />
              <Toolbar />
              <FileManagerContent />
            </TabsContent>
            
            <TabsContent value="upload">
              <div className="space-y-4">
                <Breadcrumbs />
                <Separator />
                <FileUploader />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Wrapper component that provides the context
const FileManager: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <FileManagerProvider>
        <FileManagerWithDnd />
      </FileManagerProvider>
    </DndProvider>
  );
};

export default FileManager;