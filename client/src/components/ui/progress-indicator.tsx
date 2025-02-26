
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: string;
  completedSteps: string[];
}

export function ProgressIndicator({ steps = [], currentStep, completedSteps = [] }: ProgressIndicatorProps) {
  return (
    <div className="flex justify-between mb-6">
      {steps.map((step, index) => (
        <div
          key={step}
          className={cn(
            "flex items-center",
            index < steps.length - 1 && "flex-1"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium",
              completedSteps.includes(step)
                ? "bg-[#43A047] border-[#43A047] text-white"
                : currentStep === step
                ? "border-[#43A047] text-[#43A047]"
                : "border-gray-300 text-gray-300"
            )}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-[2px] w-full mx-2",
                completedSteps.includes(step)
                  ? "bg-[#43A047]"
                  : "bg-gray-300"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
