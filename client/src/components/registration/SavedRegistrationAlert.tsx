import React from 'react';
import { Clock, Save, RefreshCw, X } from 'lucide-react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';

interface SavedRegistrationAlertProps {
  lastUpdated: number;
  onResume: () => void;
  onDiscard?: () => void; // Make this optional since we're not using it anymore
  eventName?: string;
}

export function SavedRegistrationAlert({
  lastUpdated,
  onResume,
  onDiscard,
  eventName
}: SavedRegistrationAlertProps) {
  const timeAgo = formatDistanceToNow(new Date(lastUpdated), { addSuffix: true });
  
  return (
    <Alert className="bg-primary/10 border-primary/20 mb-6 animate-fadeIn">
      <Save className="h-5 w-5 text-primary" />
      <AlertTitle className="text-primary font-semibold">Registration in progress</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          You have an unfinished registration for {eventName || 'this event'} that was saved {timeAgo}.
          We've automatically loaded your saved progress.
        </p>
      </AlertDescription>
    </Alert>
  );
}