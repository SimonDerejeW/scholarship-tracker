import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-md border border-input bg-band px-3 py-2.5 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground hover:border-mute focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
