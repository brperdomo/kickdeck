import React, { useState, useEffect, Children, isValidElement, cloneElement } from "react";
import { useMobileContext } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ResponsiveFormProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  footerClassName?: string;
  steps?: string[];
  initialStep?: number;
  onStepChange?: (step: number) => void;
}

/**
 * ResponsiveForm component optimized for mobile and desktop
 * Supports multi-step forms with navigation
 */
export function ResponsiveForm({
  children,
  title,
  description,
  onSubmit,
  onCancel,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  loading = false,
  disabled = false,
  className,
  footerClassName,
  steps,
  initialStep = 0,
  onStepChange
}: ResponsiveFormProps) {
  const { isMobile } = useMobileContext();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  
  // Handle step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);
  
  // Map form data to state
  const handleFieldChange = (name: string, value: any) => {
    setFormFields(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we have steps and not on the last step, move to next step
    if (steps && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      return;
    }
    
    if (onSubmit) {
      onSubmit(e);
    }
  };
  
  // Handle moving to previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Check if button should be submit type
  const isSubmitButton = !steps || currentStep === steps.length - 1;
  
  // Clone children to inject props
  const childrenWithProps = Children.map(children, child => {
    if (isValidElement(child)) {
      // For form elements, pass extra props
      if (child.type === 'input' || child.type === 'select' || child.type === 'textarea') {
        return cloneElement(child, {
          className: cn('touch-friendly-input', child.props.className),
          disabled: disabled || loading || child.props.disabled,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (child.props.onChange) {
              child.props.onChange(e);
            }
            handleFieldChange(child.props.name, e.target.value);
          }
        });
      }
      
      // For FormField components, pass disabled prop
      if (child.type && typeof child.type === 'function' && child.type.name === 'FormField') {
        return cloneElement(child, {
          disabled: disabled || loading || child.props.disabled
        });
      }
      
      return child;
    }
    return child;
  });
  
  // If multi-step form, only show current step
  const currentContent = steps 
    ? Children.toArray(childrenWithProps)[currentStep] || null
    : childrenWithProps;
  
  return (
    <Card className={cn("responsive-container-narrow", className)}>
      <form onSubmit={handleSubmit}>
        {(title || description || steps) && (
          <CardHeader>
            {steps && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                  {!isMobile && (
                    <div className="flex items-center">
                      {steps.map((step, index) => (
                        <div 
                          key={index}
                          className={cn(
                            "flex items-center",
                            index !== steps.length - 1 && "mr-2"
                          )}
                        >
                          <div 
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                              currentStep >= index 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {index + 1}
                          </div>
                          {index !== steps.length - 1 && (
                            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all" 
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
            
            {steps && isMobile && (
              <div className="text-sm font-medium mt-2">
                {steps[currentStep]}
              </div>
            )}
          </CardHeader>
        )}
        
        <CardContent className={cn(
          "space-y-4",
          // Add more top padding if no header
          (!title && !description && !steps) && "pt-6"
        )}>
          {currentContent}
        </CardContent>
        
        <CardFooter className={cn(
          "flex flex-col sm:flex-row gap-2 sm:gap-4",
          // For mobile, ensure space for iOS home indicator
          isMobile && "pb-8", 
          footerClassName
        )}>
          {/* On mobile, display buttons in reverse order for easier thumb access */}
          {isMobile ? (
            <>
              <Button
                type={isSubmitButton ? "submit" : "button"}
                className="w-full"
                disabled={disabled || loading}
                onClick={isSubmitButton ? undefined : () => setCurrentStep(prev => prev + 1)}
              >
                {loading ? "Loading..." : (isSubmitButton ? submitLabel : "Next")}
              </Button>
              
              {(onCancel || currentStep > 0) && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={currentStep > 0 ? handlePreviousStep : onCancel}
                >
                  {currentStep > 0 ? "Back" : cancelLabel}
                </Button>
              )}
            </>
          ) : (
            <>
              {(onCancel || currentStep > 0) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep > 0 ? handlePreviousStep : onCancel}
                >
                  {currentStep > 0 ? "Back" : cancelLabel}
                </Button>
              )}
              
              <Button
                type={isSubmitButton ? "submit" : "button"}
                disabled={disabled || loading}
                onClick={isSubmitButton ? undefined : () => setCurrentStep(prev => prev + 1)}
                className={onCancel ? "ml-auto" : ""}
              >
                {loading ? "Loading..." : (isSubmitButton ? submitLabel : "Next")}
              </Button>
            </>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}