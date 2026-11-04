import * as React from "react"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

/**
 * A native select, set like an input but lettered as board chrome: condensed caps. With
 * `typedCase`, for options that are entry names, it is lettered in body type and typed case.
 */
function NativeSelect({
  className,
  typedCase = false,
  ...props
}: React.ComponentProps<"select"> & { typedCase?: boolean }) {
  return (
    <div
      className={cn(
        "group/native-select relative w-fit has-[select:disabled]:opacity-50",
        className
      )}
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        className={cn(
          "h-11 w-full min-w-0 appearance-none truncate rounded-md border border-input bg-band pr-9 pl-3 text-base text-foreground transition-colors outline-none [color-scheme:dark] hover:border-mute focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed",
          typedCase
            ? "font-sans"
            : "font-display font-semibold tracking-[0.06em] uppercase"
        )}
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-band text-foreground", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOption }
