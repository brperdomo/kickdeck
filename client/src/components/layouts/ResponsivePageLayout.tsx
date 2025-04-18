import React from "react";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

interface ResponsivePageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  backLink?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  wide?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function ResponsivePageLayout({
  children,
  title,
  description,
  backLink,
  backLabel = "Back",
  actions,
  wide = false,
  className,
  headerClassName,
  contentClassName,
}: ResponsivePageLayoutProps) {
  const { isMobile, isTablet } = useBreakpoint();

  return (
    <div className={cn(
      "flex flex-col min-h-full responsive-container pb-12",
      wide ? "max-w-7xl" : "max-w-5xl",
      className
    )}>
      {(title || backLink || actions) && (
        <header className={cn(
          "flex flex-wrap items-center gap-4 mb-6",
          isMobile ? "flex-col items-start" : "flex-row items-center",
          headerClassName
        )}>
          <div className="flex-1 min-w-0">
            {backLink && (
              <div className="mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground hover:text-foreground pl-1"
                  asChild
                >
                  <Link href={backLink}>
                    <ChevronLeft className="h-4 w-4" />
                    {backLabel}
                  </Link>
                </Button>
              </div>
            )}
            
            {title && (
              <h1 className={cn(
                "font-bold tracking-tight",
                isMobile ? "text-2xl" : "text-3xl"
              )}>
                {title}
              </h1>
            )}
            
            {description && (
              <div className={cn(
                "text-muted-foreground mt-1",
                isMobile ? "text-sm" : "text-base"
              )}>
                {description}
              </div>
            )}
          </div>
          
          {actions && (
            <div className={cn(
              "flex gap-2",
              isMobile && "w-full"
            )}>
              {isMobile ? (
                // On mobile, render actions full width
                <div className="w-full space-y-2">
                  {React.Children.map(actions, (child: any) => {
                    if (React.isValidElement(child) && child.type === Button) {
                      return React.cloneElement(child, {
                        className: cn(child.props.className, "w-full justify-center"),
                      });
                    }
                    return child;
                  })}
                </div>
              ) : (
                // On larger screens, render actions as is
                <>{actions}</>
              )}
            </div>
          )}
        </header>
      )}
      
      <main className={cn(contentClassName)}>
        {children}
      </main>
    </div>
  );
}

interface ResponsiveSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export function ResponsiveSection({
  children,
  title,
  description,
  actions,
  className,
  titleClassName,
  contentClassName,
}: ResponsiveSectionProps) {
  const { isMobile } = useBreakpoint();
  
  return (
    <section className={cn("mb-8", className)}>
      {(title || description || actions) && (
        <div className={cn(
          "flex items-center justify-between mb-4",
          isMobile && "flex-col items-start gap-3"
        )}>
          <div>
            {title && (
              <h2 className={cn(
                "font-semibold tracking-tight",
                isMobile ? "text-xl" : "text-2xl",
                titleClassName
              )}>
                {title}
              </h2>
            )}
            
            {description && (
              <div className={cn(
                "text-muted-foreground mt-1",
                isMobile ? "text-sm" : "text-base"
              )}>
                {description}
              </div>
            )}
          </div>
          
          {actions && (
            <div className={cn(
              "flex gap-2",
              isMobile && "w-full"
            )}>
              {isMobile ? (
                // On mobile, render actions in a stack
                <div className="w-full space-y-2">
                  {React.Children.map(actions, (child: any) => {
                    if (React.isValidElement(child) && child.type === Button) {
                      return React.cloneElement(child, {
                        className: cn(child.props.className, "w-full justify-center"),
                      });
                    }
                    return child;
                  })}
                </div>
              ) : (
                // On larger screens, render actions as is
                <>{actions}</>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className={contentClassName}>{children}</div>
    </section>
  );
}