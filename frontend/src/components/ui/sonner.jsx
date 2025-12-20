import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-white text-slate-900 border border-slate-200 shadow-lg",
          description: "text-slate-500",
          actionButton:
            "bg-cyan-500 text-white",
          cancelButton:
            "bg-slate-100 text-slate-600",
          success: "bg-emerald-50 border-emerald-200 text-emerald-800",
          error: "bg-red-50 border-red-200 text-red-800",
          info: "bg-cyan-50 border-cyan-200 text-cyan-800",
          warning: "bg-orange-50 border-orange-200 text-orange-800",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }
