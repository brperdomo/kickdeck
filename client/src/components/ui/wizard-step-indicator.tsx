import { motion } from "framer-motion";
import { Check, FileText, Users, MapPin, Settings, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardStep, WIZARD_STEPS, WIZARD_STEP_CONFIG } from "@/components/forms/event-form-types";

interface WizardStepIndicatorProps {
  steps: WizardStep[];
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick: (step: WizardStep) => void;
}

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  MapPin,
  Settings,
  CheckCircle,
};

export function WizardStepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: WizardStepIndicatorProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="w-full">
      {/* Desktop layout */}
      <div className="hidden sm:flex items-start justify-between relative">
        {steps.map((step, index) => {
          const config = WIZARD_STEP_CONFIG[step];
          const isCompleted = completedSteps.includes(step);
          const isActive = step === currentStep;
          const isPending = !isCompleted && !isActive;
          const isClickable = isCompleted;
          const IconComponent = stepIcons[config.icon] || FileText;

          return (
            <div
              key={step}
              className={cn(
                "flex flex-col items-center relative z-10",
                index < steps.length - 1 ? "flex-1" : ""
              )}
            >
              {/* Circle + Connector row */}
              <div className="flex items-center w-full">
                {/* Step circle */}
                <motion.button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step)}
                  className={cn(
                    "relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 border-2",
                    isCompleted && "bg-emerald-500/20 border-emerald-400 cursor-pointer hover:bg-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
                    isActive && "border-violet-400 bg-violet-500/15 shadow-[0_0_20px_rgba(124,58,237,0.3)]",
                    isPending && "border-gray-600/50 bg-gray-800/30 cursor-default"
                  )}
                  whileHover={isClickable ? { scale: 1.1 } : undefined}
                  whileTap={isClickable ? { scale: 0.95 } : undefined}
                >
                  {/* Pulse ring for active step */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-violet-400/40"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.6, 0, 0.6],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <Check className="h-5 w-5 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <IconComponent
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-violet-300" : "text-gray-500"
                      )}
                    />
                  )}
                </motion.button>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 relative bg-gray-700/50 overflow-hidden rounded-full">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: isCompleted ? 1 : 0,
                      }}
                      style={{ originX: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>

              {/* Label */}
              <motion.span
                className={cn(
                  "text-xs mt-2 text-center leading-tight max-w-[80px]",
                  isCompleted && "text-emerald-400/80",
                  isActive && "text-violet-300 font-medium",
                  isPending && "text-gray-500"
                )}
                animate={{
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {config.shortLabel}
              </motion.span>
            </div>
          );
        })}
      </div>

      {/* Mobile layout - simplified */}
      <div className="sm:hidden">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-violet-300 font-medium whitespace-nowrap">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
              animate={{
                width: `${((currentIndex) / (steps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Current step label + description */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-full border-2 border-violet-400 bg-violet-500/15 flex items-center justify-center flex-shrink-0">
            {(() => {
              const IconComp = stepIcons[WIZARD_STEP_CONFIG[currentStep].icon] || FileText;
              return <IconComp className="h-3.5 w-3.5 text-violet-300" />;
            })()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {WIZARD_STEP_CONFIG[currentStep].label}
            </p>
            <p className="text-xs text-gray-400">
              {WIZARD_STEP_CONFIG[currentStep].description}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
