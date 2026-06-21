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
        "peer inline-flex shrink-0 items-center rounded-full transition-all duration-300 outline-none cursor-pointer shadow-inner border border-slate-200/10",
        "data-[size=default]:h-5.5 data-[size=default]:w-10 data-[size=sm]:h-4 data-[size=sm]:w-7",
        "data-[checked]:bg-emerald-500 data-[unchecked]:bg-slate-250 dark:data-[unchecked]:bg-slate-800",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          "group-data-[size=default]/switch:h-4.5 group-data-[size=default]/switch:w-4.5 group-data-[size=default]/switch:data-[checked]:translate-x-[18px] group-data-[size=default]/switch:data-[unchecked]:translate-x-[2px]",
          "group-data-[size=sm]/switch:h-3 group-data-[size=sm]/switch:w-3 group-data-[size=sm]/switch:data-[checked]:translate-x-[12px] group-data-[size=sm]/switch:data-[unchecked]:translate-x-[1px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
