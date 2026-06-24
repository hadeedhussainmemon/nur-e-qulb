"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer inline-flex shrink-0 items-center rounded-full transition-all duration-300 outline-none cursor-pointer shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] border border-slate-200/50 dark:border-slate-800/80",
        "data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-4 data-[size=sm]:w-7",
        "data-[checked]:bg-emerald-500 data-[unchecked]:bg-slate-300 dark:data-[unchecked]:bg-slate-700",
        "focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] ring-0 transition-transform duration-300 ease-out",
          "group-data-[size=default]/switch:h-5 group-data-[size=default]/switch:w-5 group-data-[size=default]/switch:data-[checked]:translate-x-[22px] group-data-[size=default]/switch:data-[unchecked]:translate-x-[2px]",
          "group-data-[size=sm]/switch:h-3 group-data-[size=sm]/switch:w-3 group-data-[size=sm]/switch:data-[checked]:translate-x-[12px] group-data-[size=sm]/switch:data-[unchecked]:translate-x-[1px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
