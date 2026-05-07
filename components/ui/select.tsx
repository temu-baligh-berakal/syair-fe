"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M5 7.5 10 12.5l5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M4.5 10.5 8 14l7.5-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={`flex h-11 w-full items-center justify-between rounded-xl border border-border/40 dark:border-white/10 bg-card dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-foreground dark:text-white shadow-sm outline-none transition hover:border-border dark:hover:border-white/20 focus:border-primary dark:focus:border-sky-400 focus:ring-4 focus:ring-primary/10 dark:focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}`}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <span className="text-muted-foreground dark:text-slate-500">
        <ChevronDownIcon />
      </span>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className = "", children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={`relative z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border/40 dark:border-white/10 bg-card dark:bg-zinc-900 text-foreground dark:text-white shadow-lg dark:shadow-xl dark:shadow-black/30 ${className}`}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={`relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none text-foreground dark:text-white data-[highlighted]:bg-muted dark:data-[highlighted]:bg-zinc-800 data-[highlighted]:text-foreground dark:data-[highlighted]:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center text-foreground dark:text-white">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
