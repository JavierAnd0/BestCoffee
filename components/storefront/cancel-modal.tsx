"use client";

import { SkipForward, PauseCircle, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function CancelModal({
  open,
  onOpenChange,
  productName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  productName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">
            Antes de cancelar…
          </DialogTitle>
          <DialogDescription>
            ¿Demasiado café? Prueba una opción más flexible antes de cancelar tu
            suscripción de {productName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Option
            icon={<SkipForward className="size-4" />}
            title="Saltar el próximo envío"
            body="Retoma automáticamente en el siguiente ciclo."
            actionLabel="Saltar"
          />
          <Option
            icon={<PauseCircle className="size-4" />}
            title="Pausar la suscripción"
            body="Sin envíos hasta que la reactives."
            actionLabel="Pausar"
          />
          <Option
            icon={<ChevronDown className="size-4" />}
            title="Reducir la frecuencia"
            body="Recibe con menos frecuencia, por ejemplo cada 8 semanas."
            actionLabel="Cambiar"
          />
        </div>

        <DialogFooter className="flex sm:justify-between gap-3">
          <button className="text-xs text-destructive hover:underline underline-offset-2">
            Sí, cancelar de todos modos
          </button>
          <Button onClick={() => onOpenChange(false)}>Conservar suscripción</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Option({
  icon,
  title,
  body,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
      <span className="size-8 rounded-md bg-background grid place-items-center text-muted-foreground">
        {icon}
      </span>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{body}</div>
      </div>
      <Button variant="outline" size="sm">
        {actionLabel}
      </Button>
    </div>
  );
}
