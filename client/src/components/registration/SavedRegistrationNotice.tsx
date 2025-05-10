import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, X, Save } from 'lucide-react';

interface SavedRegistrationNoticeProps {
  lastSaved: number;
  onResume: () => void;
  onDiscard: () => void;
  eventName?: string;
}

export function SavedRegistrationNotice({
  lastSaved,
  onResume,
  onDiscard,
  eventName = 'this event'
}: SavedRegistrationNoticeProps) {
  // Calculate time ago string
  const timeAgo = formatDistanceToNow(new Date(lastSaved), { addSuffix: true });
  
  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <Save className="h-4 w-4 text-primary" />
      <AlertTitle className="font-semibold text-primary">Registration in progress</AlertTitle>
      <AlertDescription>
        <p className="mb-3 mt-1">
          You have a saved registration in progress for {eventName} from {timeAgo}.
          We've automatically loaded your saved progress.
        </p>
        <div className="flex gap-3 mt-3">
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center" 
            onClick={onResume}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Continue Registration
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}