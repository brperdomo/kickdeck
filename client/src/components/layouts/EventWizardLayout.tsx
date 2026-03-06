import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ChevronRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardStepIndicator } from "@/components/ui/wizard-step-indicator";
import {
  WizardStep,
  WIZARD_STEPS,
  WIZARD_STEP_CONFIG,
} from "@/components/forms/event-form-types";

interface EventWizardLayoutProps {
  children: React.ReactNode;
  title: string;
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick: (step: WizardStep) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isReviewStep: boolean;
  canProceed: boolean;
  direction: number; // 1 = forward, -1 = backward (for animations)
}

export function EventWizardLayout({
  children,
  title,
  currentStep,
  completedSteps,
  onStepClick,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  isFirstStep,
  isLastStep,
  isReviewStep,
  canProceed,
  direction,
}: EventWizardLayoutProps) {
  const [, setLocation] = useLocation();
  const stepConfig = WIZARD_STEP_CONFIG[currentStep];
  const currentIndex = WIZARD_STEPS.indexOf(currentStep);

  // Apply dashboard dark theme to body for portalled elements
  useEffect(() => {
    document.body.classList.add("dashboard-dark-active");
    return () => {
      document.body.classList.remove("dashboard-dark-active");
    };
  }, []);

  return (
    <div className="min-h-screen dashboard-dark relative overflow-x-hidden"
      style={{
        backgroundColor: '#0f0f1a',
        backgroundImage: [
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 3px)',
          'linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)',
          'linear-gradient(180deg, #0f0f1a 0%, #0d0b2e 100%)',
        ].join(', '),
        backgroundSize: '100% 3px, 60px 60px, 60px 60px, 100% 100%',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none fixed"
        style={{
          top: '8%',
          right: '10%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="pointer-events-none fixed"
        style={{
          bottom: '15%',
          left: '5%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Sticky header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124, 58, 237, 0.1)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.3), 0 0 15px rgba(124,58,237,0.05)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-violet-500/10"
              onClick={() => setLocation("/admin")}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div
              className="h-5 w-px"
              style={{
                background: 'linear-gradient(to bottom, rgba(124,58,237,0) 0%, rgba(124,58,237,0.3) 50%, rgba(124,58,237,0) 100%)',
              }}
            />
            <h1 className="text-base sm:text-lg font-semibold text-white">
              {title}
            </h1>
          </div>

          {/* Step counter badge - desktop */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <span className="text-violet-300 font-medium">{currentIndex + 1}</span>
            <span>/</span>
            <span>{WIZARD_STEPS.length}</span>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <WizardStepIndicator
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={onStepClick}
        />
      </div>

      {/* Step title + description */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <motion.div
          key={currentStep + '-title'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {stepConfig.label}
          </h2>
          <p className="text-sm text-gray-400">
            {stepConfig.description}
          </p>
        </motion.div>
      </div>

      {/* Main content area — no AnimatePresence/key to avoid remounting EventForm */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-28">
        <div
          className="rounded-xl p-4 sm:p-6 md:p-8"
          style={{
            background: 'rgba(15, 15, 35, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 0 30px rgba(124,58,237,0.08), 0 0 60px rgba(6,182,212,0.04), 0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {children}
        </div>
      </main>

      {/* Sticky bottom navigation */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'rgba(15, 15, 35, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(124, 58, 237, 0.1)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.3)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Left: Back button */}
          <div>
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600/50 text-gray-300 hover:text-white hover:bg-violet-500/10 hover:border-violet-500/30"
                onClick={onBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
            )}
          </div>

          {/* Right: Next / Skip / Create */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Skip button for optional steps */}
            {!stepConfig.required && !isReviewStep && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-200"
                onClick={onNext}
                disabled={isSubmitting}
              >
                <SkipForward className="h-4 w-4 mr-1.5" />
                Skip
              </Button>
            )}

            {isReviewStep ? (
              <Button
                size="sm"
                className="px-6 font-medium"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.3), 0 0 40px rgba(124,58,237,0.1)',
                }}
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className="px-6 font-medium"
                style={{
                  background: canProceed
                    ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                    : 'rgba(124, 58, 237, 0.2)',
                  boxShadow: canProceed
                    ? '0 0 20px rgba(124,58,237,0.3), 0 0 40px rgba(124,58,237,0.1)'
                    : 'none',
                  color: canProceed ? '#ffffff' : 'rgba(255,255,255,0.4)',
                }}
                onClick={onNext}
                disabled={!canProceed || isSubmitting}
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </footer>

      {/* Floor grid effect */}
      <div className="neon-floor-grid" aria-hidden="true" />
    </div>
  );
}
