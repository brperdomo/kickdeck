import React, { useEffect, useRef } from 'react';
import { useFileManager } from './FileManagerContext';
import FileItem from './FileItem';
import FolderItem from './FolderItem';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { File, Folder, DragItem } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

// We don't need the DraggableFileItem anymore since we've moved drag functionality to FileItem component
const FileItemWrapper = ({ file }: { file: File }) => {
  return <FileItem file={file} />;
};

// We don't need the DraggableFolderItem anymore since we've moved drag functionality to FolderItem component
const FolderItemWrapper = ({ folder }: { folder: Folder }) => {
  return <FolderItem folder={folder} />;
};

const DroppableArea = ({ children }: { children: React.ReactNode }) => {
  const { currentFolder, moveItems, selectedItems, isDraggingOver, setIsDraggingOver } = useFileManager();
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['file', 'folder'],
    drop: (item: DragItem, monitor) => {
      // Only handle the drop if it wasn't dropped on a folder
      if (!monitor.didDrop()) {
        // Use the selected items for multi-drag operations
        if (selectedItems.length > 0) {
          const itemIds = selectedItems.map(item => item.id);
          moveItems(itemIds, currentFolder?.id || null);
        } else {
          // Fallback to single item if somehow no selection
          moveItems([item.id], currentFolder?.id || null);
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  });
  
  // Update the dragging state for the whole app
  useEffect(() => {
    if (setIsDraggingOver) {
      setIsDraggingOver(isOver && canDrop);
    }
  }, [isOver, canDrop, setIsDraggingOver]);
  
  return (
    <div 
      ref={drop} 
      className={cn(
        "h-full min-h-[300px] w-full transition-all duration-200 relative rounded-md",
        (isOver && canDrop) && "bg-primary/5 ring-2 ring-primary ring-inset"
      )}
    >
      {/* Drop indicator overlay that appears when items are being dragged over the area */}
      {(isOver && canDrop) && (
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] flex items-center justify-center rounded-md z-10 pointer-events-none">
          <div className="bg-card p-4 rounded-lg shadow-lg text-center">
            <FolderOpen className="h-10 w-10 mx-auto mb-2 text-primary" />
            <h3 className="text-lg font-semibold">Drop here</h3>
            <p className="text-muted-foreground text-sm">Release to move items to this folder</p>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

// Enhanced empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-64 text-center p-4 border-2 border-dashed border-muted-foreground/20 rounded-md">
    <Upload className="h-12 w-12 text-muted-foreground/50 mb-2" />
    <h3 className="text-lg font-medium mt-2">This folder is empty</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
      Drag and drop files here or use the Upload button in the toolbar to add content
    </p>
  </div>
);

const FileManagerContent: React.FC = () => {
  const { files, folders, isLoading, viewMode, isDraggingOver } = useFileManager();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center p-3 space-y-2">
            <Skeleton className="h-16 w-16 rounded" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <DndProvider backend={HTML5Backend}>
        <DroppableArea>
          {folders.length === 0 && files.length === 0 ? (
            <EmptyState />
          ) : (
            <div className={cn(
              "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-2 transition-opacity duration-200",
              isDraggingOver && "opacity-70"
            )}>
              {folders.map((folder) => (
                <FolderItemWrapper key={folder.id} folder={folder} />
              ))}
              
              {files.map((file) => (
                <FileItemWrapper key={file.id} file={file} />
              ))}
            </div>
          )}
        </DroppableArea>
      </DndProvider>
    );
  }

  // List view
  return (
    <DndProvider backend={HTML5Backend}>
      <DroppableArea>
        {folders.length === 0 && files.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={cn(
            "space-y-1 transition-opacity duration-200",
            isDraggingOver && "opacity-70"
          )}>
            <div className="grid grid-cols-12 gap-4 p-2 text-sm font-medium text-muted-foreground border-b">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Modified</div>
            </div>
            
            {folders.map((folder) => (
              <div key={folder.id} className="grid grid-cols-12 items-center rounded-md">
                <div className="col-span-6">
                  <FolderItemWrapper folder={folder} />
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">—</div>
                <div className="col-span-2 text-sm text-muted-foreground">Folder</div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(folder.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            
            {files.map((file) => (
              <div key={file.id} className="grid grid-cols-12 items-center rounded-md">
                <div className="col-span-6">
                  <FileItemWrapper file={file} />
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {getFileTypeLabel(file.type)}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(file.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </DroppableArea>
    </DndProvider>
  );
};

// Helper functions
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
};

const getFileTypeLabel = (mimeType: string = '') => {
  const types: Record<string, string> = {
    'image/': 'Image',
    'audio/': 'Audio',
    'video/': 'Video',
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'text/plain': 'Text',
    'text/html': 'HTML',
    'application/json': 'JSON',
  };
  
  for (const [type, label] of Object.entries(types)) {
    if (mimeType.startsWith(type)) {
      return label;
    }
  }
  
  return mimeType.split('/')[1] || 'Unknown';
};

export default FileManagerContent;