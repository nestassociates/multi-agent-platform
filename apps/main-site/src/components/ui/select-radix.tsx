'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/utils'

// Custom chevron icon matching the site design
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1.5L6 6.5L11 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Check icon for selected items
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 5L5 9L13 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  variant?: 'dark' | 'light'
  className?: string
  triggerClassName?: string
  itemClassName?: string
  disabled?: boolean
  name?: string
}

export function Select({
  value,
  onValueChange,
  placeholder = 'Select...',
  options,
  variant = 'dark',
  className,
  triggerClassName,
  itemClassName,
  disabled,
  name,
}: SelectProps) {
  const isDark = variant === 'dark'

  // Filter out options with empty values - Radix doesn't allow empty string values
  // The placeholder prop handles the "no selection" state
  const validOptions = options.filter((opt) => opt.value !== '')

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} name={name} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          'relative flex h-[50px] w-full items-center justify-between px-4 pr-10 text-[14px] uppercase tracking-[1px] outline-none transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isDark
            ? 'border border-white bg-transparent text-white hover:bg-white/5 focus:bg-white/5'
            : 'border border-nest-gray bg-white text-black hover:border-black focus:border-black',
          className,
          triggerClassName
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronIcon
            className={cn(
              'absolute right-4 transition-transform duration-200',
              isDark ? 'text-white' : 'text-black',
              'data-[state=open]:rotate-180'
            )}
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            'relative z-50 max-h-[300px] min-w-[var(--radix-select-trigger-width)] overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            isDark
              ? 'border border-white bg-[#5C5A58] text-white'
              : 'border border-nest-gray bg-white text-black shadow-lg'
          )}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="p-0">
            {validOptions.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'relative flex cursor-pointer select-none items-center px-4 py-3 text-[14px] uppercase tracking-[1px] outline-none',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  isDark
                    ? 'focus:bg-white/10 data-[highlighted]:bg-white/15'
                    : 'focus:bg-nest-gray/10 data-[highlighted]:bg-nest-gray/15',
                  itemClassName
                )}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-4">
                  <CheckIcon className={isDark ? 'text-white' : 'text-black'} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

// Export primitive parts for more complex use cases
export {
  SelectPrimitive as SelectRoot,
}
