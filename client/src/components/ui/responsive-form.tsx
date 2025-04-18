import React from "react";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResponsiveFormProps {
  children: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  contentClassName?: string;
  isLoading?: boolean;
}

export function ResponsiveForm({
  children,
  title,
  description,
  actions,
  className,
  onSubmit,
  contentClassName,
  isLoading = false,
}: ResponsiveFormProps) {
  const { isMobile } = useBreakpoint();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <Card className={cn("w-full", isMobile ? "shadow-sm" : "shadow", className)}>
      {title && (
        <CardHeader className={isMobile ? "p-4" : "p-6"}>
          <CardTitle className={cn(
            "text-xl font-semibold leading-tight", 
            isMobile ? "text-lg" : "text-xl"
          )}>
            {title}
          </CardTitle>
          {description && (
            <div className={cn(
              "text-muted-foreground mt-1", 
              isMobile ? "text-sm" : "text-base"
            )}>
              {description}
            </div>
          )}
        </CardHeader>
      )}
      
      <form onSubmit={handleSubmit}>
        <CardContent className={cn(
          "space-y-4",
          title ? (isMobile ? "pb-4 px-4" : "pb-6 px-6") : (isMobile ? "pt-4 px-4" : "pt-6 px-6"),
          contentClassName
        )}>
          {children}
        </CardContent>
        
        {actions && (
          <CardFooter className={cn(
            "flex items-center border-t", 
            isMobile 
              ? "px-4 py-3 flex-col space-y-2" 
              : "px-6 py-4"
          )}>
            {isMobile ? (
              // Stack buttons vertically on mobile
              <div className="w-full space-y-2">
                {React.Children.map(actions, (child: any) => {
                  // Modify each button to be full width on mobile
                  if (React.isValidElement(child) && child.type === Button) {
                    return React.cloneElement(child, {
                      className: cn(child.props.className, "w-full justify-center"),
                      disabled: isLoading || child.props.disabled,
                    });
                  }
                  return child;
                })}
              </div>
            ) : (
              // Horizontal buttons on desktop/tablet
              <div className="flex space-x-2 ml-auto">
                {React.Children.map(actions, (child: any) => {
                  if (React.isValidElement(child) && child.type === Button) {
                    return React.cloneElement(child, {
                      disabled: isLoading || child.props.disabled,
                    });
                  }
                  return child;
                })}
              </div>
            )}
          </CardFooter>
        )}
      </form>
    </Card>
  );
}

interface ResponsiveFormGroupProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ResponsiveFormGroup({
  children,
  columns = 2,
  className,
}: ResponsiveFormGroupProps) {
  const { isMobile, isTablet } = useBreakpoint();
  
  let gridCols = "grid-cols-1";
  
  if (!isMobile) {
    if (isTablet) {
      // Tablet: max 2 columns
      gridCols = columns > 2 ? "grid-cols-2" : `grid-cols-${columns}`;
    } else {
      // Desktop: as specified
      gridCols = `grid-cols-${columns}`;
    }
  }
  
  return (
    <div className={cn("grid gap-4", gridCols, className)}>
      {children}
    </div>
  );
}