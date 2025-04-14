import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileManager } from './FileManagerContext';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const FileUploader: React.FC = () => {
  const { 
    uploadFiles, 
    currentFolder, 
    uploadProgress,
    setUploadProgress = () => {} // Provide fallback
  } = useFileManager();
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles?.length) {
        uploadFiles(acceptedFiles as unknown as FileList, currentFolder?.id || null);
      }
    },
    [uploadFiles, currentFolder]
  );
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });
  
  const handleCancelUpload = (uploadId: string) => {
    // In a real implementation, we would cancel the upload request here
    setUploadProgress((prev: any) => prev.filter((p: any) => p.id !== uploadId));
  };
  
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/20 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center py-4">
          <Upload className={cn(
            "h-8 w-8 mb-2 transition-colors",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )} />
          <h3 className="text-base font-medium mb-1">
            {isDragActive 
              ? "Drop files here" 
              : "Drop files here or click to upload"
            }
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop files or folders here
          </p>
          <Button onClick={open} type="button">
            Select Files
          </Button>
        </div>
      </div>
      
      {/* Upload Progress */}
      {uploadProgress?.length > 0 && (
        <div className="space-y-2 border rounded-md p-3">
          <h4 className="font-medium text-sm mb-2">Uploads in progress</h4>
          
          {uploadProgress.map((upload) => (
            <div key={upload.id} className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[250px]">{upload.name}</span>
                  <span className="text-xs text-muted-foreground">{upload.progress}%</span>
                </div>
                <Progress value={upload.progress} className="h-1.5" />
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => handleCancelUpload(upload.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;