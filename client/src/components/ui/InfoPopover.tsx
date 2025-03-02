
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { InfoIcon } from 'lucide-react';

interface InfoPopoverProps {
  content: React.ReactNode;
}

export function InfoPopover({ content }: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <InfoIcon className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer ml-1" />
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        {content}
      </PopoverContent>
    </Popover>
  );
}
