import type * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Tooltip } from "@/components/ui/tooltip"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonTooltipProps = {
  /**
   * Texto del tooltip (aparece tras 1 s encima). Los botones de solo icono lo
   * toman de `title` o `aria-label` si no se pasa; `false` lo desactiva.
   */
  tooltip?: React.ReactNode | false
  /** Atajo de teclado mostrado en el tooltip, p. ej. "⌘ ." */
  tooltipShortcut?: React.ReactNode
  /** Segunda línea, más tenue, del tooltip. */
  tooltipDescription?: React.ReactNode
  tooltipSide?: "top" | "bottom" | "left" | "right"
}

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  tooltip,
  tooltipShortcut,
  tooltipDescription,
  tooltipSide,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> &
  ButtonTooltipProps) {
  // Base UI defaults to nativeButton=true, which throws when `render` swaps the
  // host to a non-<button> (e.g. <a> via Next <Link>). When a render prop is
  // present and the caller hasn't opted in to nativeButton explicitly, drop it
  // to false so Link/anchor renders preserve their own semantics.
  const resolvedNative =
    nativeButton ?? (render ? isNativeButtonElement(render) : true)

  const isIconOnly =
    (typeof size === "string" && size.startsWith("icon")) ||
    (!render && !hasVisibleText(props.children))
  const label =
    tooltip === false
      ? null
      : (tooltip ??
        (isIconOnly ? (props.title ?? props["aria-label"]) : undefined))

  const button = (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={render}
      nativeButton={resolvedNative}
      {...props}
      // El tooltip sustituye al nativo; con los dos se verían duplicados.
      title={label ? undefined : props.title}
    />
  )

  if (!label) return button

  return (
    <Tooltip
      content={label}
      shortcut={tooltipShortcut}
      description={tooltipDescription}
      side={tooltipSide}
    >
      {button}
    </Tooltip>
  )
}

/**
 * ¿Hay texto a la vista entre los hijos? Los iconos son elementos y el texto
 * son strings, así que basta con buscar strings (también dentro de spans).
 * Lo que va en `sr-only` no cuenta: no se ve.
 */
function hasVisibleText(node: React.ReactNode): boolean {
  if (node == null || typeof node === "boolean") return false
  if (typeof node === "string") return node.trim() !== ""
  if (typeof node === "number") return true
  if (Array.isArray(node)) return node.some(hasVisibleText)
  if (typeof node === "object" && "props" in node) {
    const p = node.props as { children?: React.ReactNode; className?: string }
    if (typeof p.className === "string" && p.className.includes("sr-only"))
      return false
    return hasVisibleText(p.children)
  }
  // Funciones de render, promesas…: mejor no adivinar y no poner tooltip.
  return true
}

function isNativeButtonElement(node: unknown): boolean {
  // Render can be a ReactElement or a render function. Functions could return
  // anything at runtime, so be conservative: assume non-button.
  if (typeof node === "function") return false
  if (node && typeof node === "object" && "type" in node) {
    const t = (node as { type: unknown }).type
    return t === "button"
  }
  return false
}

export { Button, buttonVariants }
