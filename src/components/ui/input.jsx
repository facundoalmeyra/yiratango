import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border-2 border-white/20 bg-white/5 px-4 py-2 text-base font-medium shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-white/50 focus-visible:outline-none focus-visible:border-white/50 focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:bg-white/3 disabled:border-white/10 disabled:text-white/40 disabled:opacity-100 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }