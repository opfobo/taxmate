
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        // Dynamisch Klassen und Icons je nach Typ setzen
        let style = {
          className: "bg-teal-50 border-l-4 border-teal-400 text-teal-900",
          Icon: CheckCircle,
        }

        if (variant === "destructive") {
          style = {
            className: "bg-red-50 border-l-4 border-red-500 text-red-900",
            Icon: XCircle,
          }
        }

        // Fix: Using a string comparison with a type guard instead
        if (typeof variant === 'string' && variant === "warning") {
          style = {
            className: "bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900",
            Icon: AlertTriangle,
          }
        }

        const { className, Icon } = style

        return (
          <Toast key={id} {...props} className={`${className} shadow-md`}>
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 w-4 h-4" />
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
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
