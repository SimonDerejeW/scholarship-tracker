import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-band px-3 text-base text-foreground transition-colors outline-none [color-scheme:dark] placeholder:text-muted-foreground hover:border-mute focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
