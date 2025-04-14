import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useFileManager } from './FileManagerContext';
import { Button } from '@/components/ui/button';
import { FileBreadcrumb } from './types';

const Breadcrumbs: React.FC = () => {
  const { breadcrumbs, navigateToFolder } = useFileManager();
  
  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 px-2 py-1 shrink-0 h-auto ${
              index === breadcrumbs.length - 1 ? 'font-medium text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => navigateToFolder(crumb.id)}
          >
            {index === 0 && <Home className="h-3.5 w-3.5 mr-1" />}
            <span className="truncate max-w-[150px]">{crumb.name}</span>
          </Button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;