import { useState, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { EventForm } from "@/components/forms/EventForm";
import {
  type EventTab,
  type WizardStep,
  type ReviewFormData,
  WIZARD_STEPS,
  WIZARD_STEP_CONFIG,
} from "@/components/forms/event-form-types";
import { EventWizardLayout } from "@/components/layouts/EventWizardLayout";
import { EventReviewStep } from "@/components/forms/EventReviewStep";

export default function CreateEvent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("event-information");
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [direction, setDirection] = useState(1); // 1=forward, -1=backward

  // Validation & form data from EventForm
  const [validationState, setValidationState] = useState<Record<string, boolean>>({
    information: false,
    "age-groups": false,
    complexes: false,
    settings: true,
  });
  const [formDataSnapshot, setFormDataSnapshot] = useState<ReviewFormData | null>(null);

  // Refs for imperative calls into EventForm
  const validateStepRef = useRef<(() => Promise<boolean>) | null>(null);
  const submitRef = useRef<(() => void) | null>(null);

  // Map wizard step to EventForm tab
  const activeTab: EventTab = useMemo(() => {
    const tab = WIZARD_STEP_CONFIG[currentStep]?.mapsToTab;
    return (tab || "information") as EventTab;
  }, [currentStep]);

  // Track completed tabs for EventForm (maps from wizard completed steps)
  const completedTabs: EventTab[] = useMemo(() => {
    return completedSteps
      .map((step) => WIZARD_STEP_CONFIG[step]?.mapsToTab)
      .filter(Boolean) as EventTab[];
  }, [completedSteps]);

  // Can the user proceed from the current step?
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case "event-information":
        return validationState.information;
      case "age-groups":
        return validationState["age-groups"];
      case "venues-fields":
        return validationState.complexes;
      case "settings-branding":
        return true; // optional step
      case "review":
        return true;
      default:
        return false;
    }
  }, [currentStep, validationState]);

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Event created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = useCallback(async (data: any) => {
    await createEventMutation.mutateAsync(data);
  }, [createEventMutation]);

  // Navigate to next step
  const handleNext = useCallback(async () => {
    // Validate current step before proceeding
    if (currentStep !== "review" && validateStepRef.current) {
      const isValid = await validateStepRef.current();
      if (!isValid) return;
    }

    // Mark current step as completed
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);

    // Move to next step
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    if (currentIndex < WIZARD_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(WIZARD_STEPS[currentIndex + 1]);
    }
  }, [currentStep]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentStep(WIZARD_STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  // Click on a completed step indicator
  const handleStepClick = useCallback((step: WizardStep) => {
    const targetIndex = WIZARD_STEPS.indexOf(step);
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    setDirection(targetIndex < currentIndex ? -1 : 1);
    setCurrentStep(step);
  }, [currentStep]);

  // Submit the form from the review step
  const handleSubmit = useCallback(() => {
    if (submitRef.current) {
      submitRef.current();
    }
  }, []);

  const isFirstStep = currentStep === WIZARD_STEPS[0];
  const isLastStep = currentStep === WIZARD_STEPS[WIZARD_STEPS.length - 1];
  const isReviewStep = currentStep === "review";

  return (
    <EventWizardLayout
      title="Create New Event"
      currentStep={currentStep}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleSubmit}
      isSubmitting={createEventMutation.isPending}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      isReviewStep={isReviewStep}
      canProceed={canProceed}
      direction={direction}
    >
      {/* Review step overlay — shown on top when active */}
      {isReviewStep && (
        <EventReviewStep
          formData={formDataSnapshot || {
            name: "",
            startDate: "",
            endDate: "",
            timezone: "",
            applicationDeadline: "",
            hasDetails: false,
            hasAgreement: false,
            hasRefundPolicy: false,
            ageGroupCount: 0,
            seasonalScopeName: "",
            selectedComplexCount: 0,
            complexNames: [],
            primaryColor: "#007AFF",
            secondaryColor: "#34C759",
            logoPreviewUrl: null,
            settingsCount: 0,
            allowPayLater: false,
          }}
          onEditStep={handleStepClick}
        />
      )}
      {/* EventForm always mounted (hidden on review) to preserve state */}
      <div style={{ display: isReviewStep ? 'none' : undefined }}>
        <EventForm
          mode="create"
          layout="wizard"
          onSubmit={handleFormSubmit}
          isSubmitting={createEventMutation.isPending}
          activeTab={activeTab}
          onTabChange={() => {}}
          completedTabs={completedTabs}
          onCompletedTabsChange={() => {}}
          navigateTab={() => {}}
          onValidationStateChange={setValidationState}
          onFormDataChange={setFormDataSnapshot}
          validateStepRef={validateStepRef}
          submitRef={submitRef}
        />
      </div>
    </EventWizardLayout>
  );
}
