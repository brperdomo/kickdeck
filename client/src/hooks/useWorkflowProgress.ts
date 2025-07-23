import { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStep {
  stepId: string;
  stepName: string;
  isComplete: boolean;
  data: any;
  completedAt?: string;
  lastModified: string;
}

interface WorkflowProgress {
  eventId: string;
  workflowType: 'scheduling';
  currentStep: number;
  steps: WorkflowStep[];
  autoSaveEnabled: boolean;
  lastSaved: string;
  sessionId: string;
}

export function useWorkflowProgress(eventId: string, workflowType: 'scheduling' = 'scheduling') {
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate session ID for this browser session
  const sessionId = `${eventId}-${workflowType}-${Date.now()}`;

  // Load saved progress
  const { data: savedProgress, isLoading } = useQuery({
    queryKey: ['workflow-progress', eventId, workflowType],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/workflow-progress?type=${workflowType}`);
      if (!response.ok) {
        if (response.status === 404) return null; // No saved progress
        throw new Error('Failed to load workflow progress');
      }
      return response.json();
    }
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (progress: Partial<WorkflowProgress>) => {
      const response = await fetch(`/api/admin/events/${eventId}/workflow-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...progress,
          eventId,
          workflowType,
          sessionId,
          lastSaved: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Failed to save progress');
      return response.json();
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['workflow-progress', eventId, workflowType] });
    },
    onError: (error) => {
      console.error('Progress save failed:', error);
      toast({
        title: "Auto-save Failed",
        description: "Your progress could not be saved. Please save manually.",
        variant: "destructive"
      });
    }
  });

  // Manual save only (auto-save disabled)
  const enableAutoSave = (intervalMs: number = 30000) => {
    // Manual save mode - no auto-save intervals
    // Auto-save is disabled for manual save workflow
  };

  const disableAutoSave = () => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      setAutoSaveInterval(null);
    }
  };

  // Manual save with user feedback
  const manualSave = async () => {
    if (!isDirty || !savedProgress) return;
    
    try {
      await saveProgressMutation.mutateAsync(savedProgress);
      setIsDirty(false);
      return { success: true, message: "Progress saved successfully" };
    } catch (error) {
      console.error('Manual save failed:', error);
      return { success: false, message: "Failed to save progress" };
    }
  };

  // Manual save function
  const saveProgress = (progressData?: Partial<WorkflowProgress>) => {
    if (progressData) {
      saveProgressMutation.mutate(progressData);
    } else if (savedProgress && isDirty) {
      saveProgressMutation.mutate(savedProgress);
    }
  };

  // Update step data
  const updateStepData = (stepId: string, data: any, isComplete: boolean = false) => {
    if (!savedProgress) return;

    const updatedSteps = savedProgress.steps.map((step: WorkflowStep) => 
      step.stepId === stepId 
        ? {
            ...step,
            data: { ...step.data, ...data },
            isComplete,
            lastModified: new Date().toISOString(),
            ...(isComplete && !step.isComplete ? { completedAt: new Date().toISOString() } : {})
          }
        : step
    );

    const updatedProgress = {
      ...savedProgress,
      steps: updatedSteps,
      lastSaved: new Date().toISOString()
    };

    setIsDirty(true);
    queryClient.setQueryData(['workflow-progress', eventId, workflowType], updatedProgress);
  };

  // Move to next step
  const advanceToStep = (stepNumber: number) => {
    if (!savedProgress) return;

    const updatedProgress = {
      ...savedProgress,
      currentStep: stepNumber,
      lastSaved: new Date().toISOString()
    };

    setIsDirty(true);
    queryClient.setQueryData(['workflow-progress', eventId, workflowType], updatedProgress);
  };

  // Initialize progress for new workflow
  const initializeProgress = (steps: Omit<WorkflowStep, 'lastModified'>[]) => {
    const initialProgress: WorkflowProgress = {
      eventId,
      workflowType,
      currentStep: 0,
      steps: steps.map(step => ({
        ...step,
        lastModified: new Date().toISOString()
      })),
      autoSaveEnabled: true,
      lastSaved: new Date().toISOString(),
      sessionId
    };

    saveProgressMutation.mutate(initialProgress);
  };

  // Clear progress (when workflow is completed or reset)
  const clearProgress = async () => {
    try {
      await fetch(`/api/admin/events/${eventId}/workflow-progress?type=${workflowType}`, {
        method: 'DELETE'
      });
      queryClient.removeQueries({ queryKey: ['workflow-progress', eventId, workflowType] });
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [autoSaveInterval]);

  // Auto-save on window unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        // Force synchronous save attempt
        if (savedProgress) {
          navigator.sendBeacon(
            `/api/admin/events/${eventId}/workflow-progress`,
            JSON.stringify({
              ...savedProgress,
              lastSaved: new Date().toISOString()
            })
          );
        }
        
        // Show warning to user
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, savedProgress, eventId]);

  return {
    // State
    savedProgress,
    isLoading,
    isDirty,
    isSaving: saveProgressMutation.isPending,
    
    // Actions
    saveProgress,
    manualSave,
    updateStepData,
    advanceToStep,
    initializeProgress,
    clearProgress,
    enableAutoSave,
    disableAutoSave,
    
    // Utils
    getStepData: (stepId: string) => savedProgress?.steps.find((s: WorkflowStep) => s.stepId === stepId)?.data,
    isStepComplete: (stepId: string) => savedProgress?.steps.find((s: WorkflowStep) => s.stepId === stepId)?.isComplete || false,
    getCurrentStep: () => savedProgress?.currentStep || 0,
    getCompletionPercentage: () => {
      if (!savedProgress?.steps.length) return 0;
      const completedSteps = savedProgress.steps.filter((s: WorkflowStep) => s.isComplete).length;
      return Math.round((completedSteps / savedProgress.steps.length) * 100);
    }
  };
}