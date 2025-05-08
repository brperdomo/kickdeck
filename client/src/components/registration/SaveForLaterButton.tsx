import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SaveForLaterButtonProps {
  onSave: () => boolean;
  className?: string;
}

export function SaveForLaterButton({ onSave, className = '' }: SaveForLaterButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  
  const handleSave = () => {
    setIsSaving(true);
    
    try {
      const success = onSave();
      
      if (success) {
        setShowSavedConfirmation(true);
        setTimeout(() => {
          setShowSavedConfirmation(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving registration:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving || showSavedConfirmation}
            className={`text-primary border-primary/30 hover:bg-primary/10 ${className}`}
          >
            {showSavedConfirmation ? (
              <>
                <Check className="h-4 w-4 mr-1 text-green-500" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save for Later'}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save your progress and return later to complete registration.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}