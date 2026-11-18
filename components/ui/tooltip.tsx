"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

/** Lo que hay que esperar con el cursor (o el dedo) encima antes de mostrarlo. */
const OPEN_DELAY = 1000

/**
 * Agrupa los tooltips de una zona: tras abrir uno, los vecinos aparecen sin
 * esperar mientras el cursor siga moviéndose entre ellos (como en las barras
 * de herramientas de las apps de escritorio).
 */
function TooltipProvider({
  delay = OPEN_DELAY,
  closeDelay = 0,
  timeout = 400,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      delay={delay}
      closeDelay={closeDelay}
      timeout={timeout}
      {...props}
    />
  )
}

type TooltipProps = {
  /** El elemento que dispara el tooltip (un botón, normalmente). */
  children: React.ReactElement
  /** Texto principal: qué hace el control. */
  content: React.ReactNode
  /** Línea secundaria más tenue, opcional. */
  description?: React.ReactNode
  /** Atajo de teclado que se muestra a la derecha, p. ej. "⌘ ." */
  shortcut?: React.ReactNode
  side?: TooltipPrimitive.Positioner.Props["side"]
  align?: TooltipPrimitive.Positioner.Props["align"]
  sideOffset?: number
  delay?: number
  disabled?: boolean
  className?: string
}

/**
 * Tooltip oscuro con retardo de 1 s. Se abre al dejar el cursor encima, al
 * llegar con el teclado o, en pantallas táctiles, al mantener presionado.
 */
function Tooltip({
  children,
  content,
  description,
  shortcut,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  delay = OPEN_DELAY,
  disabled,
  className,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  const longPress = useLongPress(delay, () => setOpen(true))

  if (disabled || content == null || content === "") return children

  return (
    <TooltipPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        // Al levantar el dedo tras una pulsación larga Base UI intenta cerrar
        // por "press"; lo dejamos visible hasta que se toque otra cosa.
        if (!next && longPress.justFired()) return
        setOpen(next)
      }}
    >
      <TooltipPrimitive.Trigger
        delay={delay}
        render={children}
        {...longPress.handlers}
      />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={8}
          className="z-[60]"
        >
          <TooltipPrimitive.Popup
            data-slot="tooltip"
            className={cn(
              "max-w-72 origin-(--transform-origin) rounded-lg bg-foreground px-2.5 py-1.5 text-[0.8125rem] leading-snug text-background shadow-lg select-none",
              "transition-[opacity,scale] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:opacity-0 data-instant:duration-0",
              className
            )}
          >
            <span className="flex items-center gap-3">
              <span className="font-medium">{content}</span>
              {shortcut ? (
                <kbd className="ml-auto font-sans text-[0.75rem] tracking-wide text-background/55">
                  {shortcut}
                </kbd>
              ) : null}
            </span>
            {description ? (
              <span className="mt-0.5 block text-[0.75rem] text-background/60">
                {description}
              </span>
            ) : null}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

/**
 * Pulsación larga solo para táctil: el ratón ya tiene hover. Si llega a
 * dispararse, se anula el clic que sigue para que mirar la ayuda no ejecute
 * la acción del botón.
 */
function useLongPress(delay: number, onFire: () => void) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedAt = React.useRef(0)

  const clear = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])

  React.useEffect(() => clear, [clear])

  const justFired = () => Date.now() - firedAt.current < 600

  return {
    justFired,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        firedAt.current = 0
        clear()
        if (e.pointerType !== "touch") return
        timer.current = setTimeout(() => {
          firedAt.current = Date.now()
          onFire()
        }, delay)
      },
      onPointerUp: () => {
        // Soltó antes de tiempo: era un toque normal.
        if (timer.current) return clear()
        // Soltó tras disparar: la ventana para ignorar el clic cuenta desde aquí.
        if (firedAt.current) firedAt.current = Date.now()
      },
      onPointerCancel: clear,
      onPointerLeave: clear,
      onContextMenu: (e: React.MouseEvent) => {
        // iOS/Android abren su menú propio al mantener presionado.
        if (justFired() || timer.current) e.preventDefault()
      },
      onClickCapture: (e: React.MouseEvent) => {
        if (justFired()) {
          e.preventDefault()
          e.stopPropagation()
        }
      },
    },
  }
}

export { Tooltip, TooltipProvider }
