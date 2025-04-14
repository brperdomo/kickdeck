import React, { useRef } from 'react';
import { useFileManager } from './FileManagerContext';
import FileItem from './FileItem';
import FolderItem from './FolderItem';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { File, Folder, DragItem } from './types';
import { Skeleton } from '@/components/ui/skeleton';

const DraggableFileItem = ({ file }: { file: File }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'file',
    item: { id: file.id, type: 'file', name: file.name } as DragItem,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag}>
      <FileItem file={file} isDragging={isDragging} />
    </div>
  );
};

const DraggableFolderItem = ({ folder }: { folder: Folder }) => {
  const { moveItems } = useFileManager();
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'folder',
    item: { id: folder.id, type: 'folder', name: folder.name } as DragItem,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['file', 'folder'],
    drop: (item: DragItem) => {
      if (item.type === 'file') {
        moveItems([item.id], folder.id);
      } else if (item.type === 'folder' && item.id !== folder.id) {
        // Prevent dropping a folder into itself
        moveItems([item.id], folder.id);
      }
    },
    canDrop: (item) => {
      // Prevent dropping a folder into itself or its own children
      if (item.type === 'folder' && item.id === folder.id) {
        return false;
      }
      return true;
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));
  
  return (
    <div 
      ref={(node) => drag(drop(node))}
      className={`
        ${(isOver && canDrop) ? 'ring-2 ring-primary bg-primary/5' : ''}
        ${(!canDrop && isOver) ? 'ring-2 ring-destructive bg-destructive/5' : ''}
        rounded-md
      `}
    >
      <FolderItem folder={folder} isDragging={isDragging} />
    </div>
  );
};

const DroppableArea = ({ children }: { children: React.ReactNode }) => {
  const { currentFolder, moveItems } = useFileManager();
  
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['file', 'folder'],
    drop: (item: DragItem, monitor) => {
      // Only handle the drop if it wasn't dropped on a folder
      if (!monitor.didDrop()) {
        moveItems([item.id], currentFolder?.id || null);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  }));
  
  return (
    <div 
      ref={drop} 
      className={`
        h-full min-h-[300px] w-full
        ${(isOver && canDrop) ? 'bg-primary/5 ring-2 ring-primary ring-inset' : ''}
        rounded-md
      `}
    >
      {children}
    </div>
  );
};

const FileManagerContent: React.FC = () => {
  const { files, folders, isLoading, viewMode } = useFileManager();

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
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
              <p>This folder is empty</p>
              <p className="text-sm">Drag and drop files or use the toolbar to add content</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {folders.map((folder) => (
                <DraggableFolderItem key={folder.id} folder={folder} />
              ))}
              
              {files.map((file) => (
                <DraggableFileItem key={file.id} file={file} />
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
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
            <p>This folder is empty</p>
            <p className="text-sm">Drag and drop files or use the toolbar to add content</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-4 p-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Modified</div>
            </div>
            
            {folders.map((folder) => (
              <div key={folder.id} className="grid grid-cols-12 items-center p-2 hover:bg-muted rounded-md">
                <div className="col-span-6">
                  <DraggableFolderItem folder={folder} />
                </div>
                <div className="col-span-2">—</div>
                <div className="col-span-2">Folder</div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(folder.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            
            {files.map((file) => (
              <div key={file.id} className="grid grid-cols-12 items-center p-2 hover:bg-muted rounded-md">
                <div className="col-span-6">
                  <DraggableFileItem file={file} />
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

const getFileTypeLabel = (mimeType: string) => {
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