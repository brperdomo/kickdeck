import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Button } from "../../components/ui/button";

interface HelpButtonProps {
  title: string;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function HelpButton({ title, content, side = "right" }: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          aria-label={`Help for ${title}`}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-80">
        <div className="space-y-2">
          <h3 className="font-medium">{title}</h3>
          <div className="text-sm text-muted-foreground">{content}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
