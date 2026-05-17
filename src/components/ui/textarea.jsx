import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border-2 border-white/20 bg-white/5 px-4 py-3 text-base font-medium shadow-sm placeholder:text-white/50 focus-visible:outline-none focus-visible:border-white/50 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:bg-white/3 disabled:border-white/10 disabled:text-white/40 disabled:opacity-100 md:text-sm resize-none",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }