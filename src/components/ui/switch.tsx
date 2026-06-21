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
        "peer inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none cursor-pointer",
        "data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-3.5 data-[size=sm]:w-6",
        "data-[checked]:bg-emerald-500 data-[unchecked]:bg-slate-300 dark:data-[unchecked]:bg-slate-700",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow transition-transform",
          "group-data-[size=default]/switch:h-4 group-data-[size=default]/switch:w-4 group-data-[size=default]/switch:data-[checked]:translate-x-[16px] group-data-[size=default]/switch:data-[unchecked]:translate-x-[2px]",
          "group-data-[size=sm]/switch:h-2.5 group-data-[size=sm]/switch:w-2.5 group-data-[size=sm]/switch:data-[checked]:translate-x-[10px] group-data-[size=sm]/switch:data-[unchecked]:translate-x-[1px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
