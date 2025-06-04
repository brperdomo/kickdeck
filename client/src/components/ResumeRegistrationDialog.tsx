import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface RegistrationCart {
  id: number;
  eventId: string;
  formData: Record<string, any>;
  currentStep: string;
  selectedAgeGroupId?: number;
  selectedBracketId?: number;
  selectedClubId?: number;
  selectedFeeIds?: string;
  totalAmount?: number;
  lastUpdated: string;
  createdAt: string;
}

interface ResumeRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cart: RegistrationCart;
  onResume: () => void;
  onStartFresh: () => void;
  isClearing?: boolean;
}

const stepLabels: Record<string, string> = {
  'age-group': 'Age Group Selection',
  'team': 'Team Information',
  'players': 'Player Roster',
  'payment': 'Payment Information',
  'success': 'Registration Complete'
};

export function ResumeRegistrationDialog({
  isOpen,
  onClose,
  cart,
  onResume,
  onStartFresh,
  isClearing = false
}: ResumeRegistrationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResume = () => {
    setIsProcessing(true);
    onResume();
  };

  const handleStartFresh = () => {
    setIsProcessing(true);
    onStartFresh();
  };

  const getStepProgress = (currentStep: string) => {
    const steps = ['age-group', 'team', 'players', 'payment'];
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex >= 0 ? currentIndex + 1 : 1;
  };

  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return 'Recently';
    }
  };

  const getTeamName = () => {
    return cart.formData?.name || 'Your Team';
  };

  const getAgeGroupName = () => {
    return cart.formData?.selectedAgeGroup?.ageGroup || 'Selected Age Group';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Registration in Progress
          </DialogTitle>
          <DialogDescription>
            You have an existing registration for this event that was saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Registration Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Team Name:</span>
              <span className="text-sm text-gray-900">{getTeamName()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Age Group:</span>
              <span className="text-sm text-gray-900">{getAgeGroupName()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progress:</span>
              <span className="text-sm text-gray-900">
                Step {getStepProgress(cart.currentStep)} - {stepLabels[cart.currentStep] || 'In Progress'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Last Updated:</span>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                {formatLastUpdated(cart.lastUpdated)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{getStepProgress(cart.currentStep)}/4 steps</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getStepProgress(cart.currentStep) / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleStartFresh}
            disabled={isProcessing || isClearing}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isClearing ? 'Clearing...' : 'Start Fresh'}
          </Button>
          <Button
            onClick={handleResume}
            disabled={isProcessing || isClearing}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {isProcessing ? 'Loading...' : 'Resume Registration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}