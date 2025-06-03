import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getToastIcon = (variant: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      case "destructive":
        return <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      default:
        return <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3 items-start w-full">
              {getToastIcon(variant || "default")}
              <div className="flex-1 grid gap-1 select-text min-w-0">
                {title && <ToastTitle className="break-words hyphens-auto">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="break-words hyphens-auto whitespace-pre-wrap">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
