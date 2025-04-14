import React, { useEffect, useState, useRef } from 'react';
import { useFileManager } from './FileManagerContext';
import FileItem from './FileItem';
import FolderItem from './FolderItem';
import { useDrop } from 'react-dnd';
import { File, Folder, DragItem } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Upload, 
  FolderOpen, 
  Check, 
  ArrowDown, 
  MoveHorizontal, 
  Zap,
  FolderDot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Wrapper components for file and folder items
const FileItemWrapper = ({ file }: { file: File }) => {
  return <FileItem file={file} />;
};

const FolderItemWrapper = ({ folder }: { folder: Folder }) => {
  return <FolderItem folder={folder} />;
};

const DroppableArea = ({ children }: { children: React.ReactNode }) => {
  const { currentFolder, moveItems, selectedItems, isDraggingOver, setIsDraggingOver } = useFileManager();
  const [didJustDrop, setDidJustDrop] = useState(false);
  const [dropCount, setDropCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Configure drop functionality for the main content area
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['file', 'folder'],
    drop: (item: DragItem, monitor) => {
      // Only handle the drop if it wasn't dropped on a folder
      if (!monitor.didDrop()) {
        console.log('Dropping in main area', { item, selectedItems });
        try {
          // Use the selected items for multi-drag operations
          const itemIds = selectedItems.length > 0 
            ? selectedItems.map(item => item.id) 
            : [item.id]; // Fallback to single item if somehow no selection
            
          console.log('Moving items to', currentFolder?.id || 'root folder', ':', itemIds);
          
          // Use the improved moveItems function
          const moveResult = await moveItems(itemIds, currentFolder?.id || null);
          console.log('Move result:', moveResult);
          
          // Check if the move was successful
          if (moveResult && moveResult.moved) {
            // Show success feedback
            setDidJustDrop(true);
            setDropCount(prev => prev + 1);
            
            // Clear any existing timer
            if (timerRef.current) {
              clearTimeout(timerRef.current);
            }
            
            // Set a new timer
            timerRef.current = setTimeout(() => {
              setDidJustDrop(false);
              timerRef.current = null;
            }, 2000);
            
            return moveResult; // Return the result for the FileItem component to check
          } else {
            console.error('Move operation failed:', moveResult);
            return { moved: false, error: true };
          }
        } catch (error) {
          console.error('Error moving items:', error);
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  });
  
  // Cancel the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  // Update the dragging state for the whole app
  useEffect(() => {
    if (setIsDraggingOver) {
      setIsDraggingOver(isOver && canDrop);
    }
  }, [isOver, canDrop, setIsDraggingOver]);
  
  const showDropOverlay = isOver && canDrop;
  const folderName = currentFolder?.name || 'root';
  
  return (
    <div 
      ref={drop} 
      className={cn(
        "h-full min-h-[300px] w-full transition-all duration-300 relative rounded-md",
        showDropOverlay && "bg-primary/5 ring-2 ring-primary ring-inset",
        !showDropOverlay && didJustDrop && "ring-2 ring-green-500/50",
        "overflow-hidden" // Ensure the animation stays within bounds
      )}
    >
      {/* Drop indicator overlay that appears when items are being dragged over the area */}
      <AnimatePresence>
        {showDropOverlay && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] flex items-center justify-center rounded-md z-10 pointer-events-none"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ 
                scale: [0.98, 1.02, 1],
                y: [0, -5, 0]
              }}
              transition={{ 
                duration: 0.5, 
                repeat: Infinity, 
                repeatType: "mirror"
              }}
              className="bg-card p-5 rounded-lg shadow-lg text-center max-w-md"
            >
              <motion.div
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <FolderOpen className="h-16 w-16 mx-auto mb-3 text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-1">Drop to Move</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Release to move {selectedItems.length > 1 ? `${selectedItems.length} items` : 'item'} to {folderName === 'root' ? 'root folder' : `"${folderName}"`}
              </p>
              <motion.div 
                className="flex items-center justify-center mt-3 text-sm bg-primary/10 text-primary py-1.5 px-3 rounded-full gap-2 max-w-fit mx-auto"
                animate={{ 
                  scale: [1, 1.03, 1],
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <MoveHorizontal className="h-4 w-4" />
                <span>Moving {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Success animation after dropping */}
        {didJustDrop && (
          <motion.div 
            key={`success-${dropCount}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              type: "spring",
              stiffness: 500, 
              damping: 30
            }}
            className="absolute top-4 right-4 bg-green-500 text-white rounded-md py-2 px-4 shadow-lg flex items-center gap-2 z-20"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 15, 0]
              }}
              transition={{ duration: 0.5 }}
            >
              <Check className="h-5 w-5" />
            </motion.div>
            <span>
              {selectedItems.length > 1 
                ? `${selectedItems.length} items moved successfully` 
                : 'Item moved successfully'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add a subtle background pattern when dragging is active but not over this area */}
      {isDraggingOver && !isOver && (
        <div className="absolute inset-0 bg-primary/5 opacity-30 pointer-events-none z-0">
          <div className="absolute inset-0 bg-grid-primary/10"></div>
        </div>
      )}
      
      {children}
    </div>
  );
};

// Enhanced empty state component with animation and better visual cues
const EmptyState = () => {
  const { currentFolder, isDraggingOver } = useFileManager();
  const folderName = currentFolder?.name || 'root folder';
  
  return (
    <motion.div 
      initial={{ opacity: 0.5, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center h-72 text-center p-6 border-2 border-dashed border-muted-foreground/20 rounded-md transition-all duration-300",
        isDraggingOver && "bg-primary/5 border-primary/40"
      )}
    >
      {isDraggingOver ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              y: [0, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-3"
          >
            <FolderDot className="h-20 w-20 text-primary/70 mx-auto" />
          </motion.div>
          <motion.h3 
            className="text-xl font-medium mb-2 text-primary"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Drop Here!
          </motion.h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Release to move items to this folder
          </p>
        </motion.div>
      ) : (
        <>
          <Upload className="h-14 w-14 text-muted-foreground/50 mb-3" />
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-medium mt-2"
          >
            This folder is empty
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground mt-2 max-w-xs"
          >
            Drag and drop files here or use the Upload button in the toolbar to add content to <span className="font-medium">{folderName}</span>
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-xs text-muted-foreground flex items-center gap-1"
          >
            <ArrowDown className="h-3 w-3" />
            <span>Drop files anywhere in this area</span>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

// Enhanced success toast that shows after operations
const SuccessToast = ({ message, isVisible, onHide }: { message: string, isVisible: boolean, onHide: () => void }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="fixed top-4 right-4 bg-green-500 text-white rounded-md py-2 px-4 shadow-lg z-50 flex items-center gap-2"
        >
          <Zap className="h-5 w-5" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FileManagerContent: React.FC = () => {
  const { files, folders, isLoading, viewMode, isDraggingOver } = useFileManager();
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
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

  // Grid view
  if (viewMode === 'grid') {
    return (
      <>
        <DroppableArea>
          {folders.length === 0 && files.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 transition-all duration-200",
                isDraggingOver && "opacity-70"
              )}
            >
              {folders.map((folder) => (
                <FolderItemWrapper key={folder.id} folder={folder} />
              ))}
              
              {files.map((file) => (
                <FileItemWrapper key={file.id} file={file} />
              ))}
            </motion.div>
          )}
        </DroppableArea>
        <SuccessToast 
          message={successMessage} 
          isVisible={showSuccess} 
          onHide={() => setShowSuccess(false)} 
        />
      </>
    );
  }

  // List view
  return (
    <>
      <DroppableArea>
        {folders.length === 0 && files.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "space-y-1 transition-all duration-200",
              isDraggingOver && "opacity-70"
            )}
          >
            <div className="grid grid-cols-12 gap-4 p-2 text-sm font-medium text-muted-foreground border-b sticky top-0 bg-background z-10">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Modified</div>
            </div>
            
            {folders.map((folder) => (
              <div key={folder.id} className="grid grid-cols-12 items-center rounded-md hover:bg-muted/50 transition-colors">
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
              <div key={file.id} className="grid grid-cols-12 items-center rounded-md hover:bg-muted/50 transition-colors">
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
          </motion.div>
        )}
      </DroppableArea>
      <SuccessToast 
        message={successMessage} 
        isVisible={showSuccess} 
        onHide={() => setShowSuccess(false)} 
      />
    </>
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