import React, { useState } from 'react';
import { Button } from "../../components/ui/button";
import { Save, Check } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";

interface SaveForLaterButtonProps {
  onSave: () => boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SaveForLaterButton({
  onSave,
  variant = 'outline',
  size = 'sm',
  className = ''
}: SaveForLaterButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedConfirmation, setSavedConfirmation] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    
    try {
      const success = onSave();
      
      if (success) {
        // Show success state momentarily
        setSavedConfirmation(true);
        
        // Show toast notification
        toast({
          title: "Progress Saved",
          description: "Your registration has been saved. You can return later to complete it.",
        });
        
        // Reset to normal state after delay
        setTimeout(() => {
          setSavedConfirmation(false);
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: "Failed to save your registration progress.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSave}
      disabled={isSaving || savedConfirmation}
      className={className}
    >
      {savedConfirmation ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-500" />
          Saved
        </>
      ) : (
        <>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save for Later'}
        </>
      )}
    </Button>
  );
}