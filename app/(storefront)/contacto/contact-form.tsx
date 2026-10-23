"use client";

import { useState, useTransition } from "react";
import { Mail, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "pedido",
    message: "",
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      // Simular despacho de mensaje al soporte
      await new Promise((res) => setTimeout(res, 600));
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <div className="mx-auto size-12 rounded-full bg-primary/10 grid place-items-center text-primary">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="font-display text-2xl font-semibold">¡Mensaje recibido!</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Gracias por contactarnos, {formData.name || "amigo cafetero"}. Nuestro equipo de baristas y soporte te responderá a{" "}
          <strong className="text-foreground">{formData.email}</strong> en menos de 24 horas hábiles.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSubmitted(false);
            setFormData({ name: "", email: "", subject: "pedido", message: "" });
          }}
          className="mt-4"
        >
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-8 space-y-5 shadow-xs"
    >
      <div className="flex items-center gap-2 mb-2 text-primary font-medium text-sm">
        <Mail className="size-4" />
        <span>Escríbenos directamente</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact-name" className="text-xs">
            Nombre completo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-name"
            required
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="Tu nombre"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="contact-email" className="text-xs">
            Correo electrónico <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            placeholder="tu@correo.com"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contact-subject" className="text-xs">
          Motivo de tu consulta
        </Label>
        <select
          id="contact-subject"
          value={formData.subject}
          onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
          className="mt-1 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="pedido">Estado o duda sobre un pedido</option>
          <option value="suscripcion">Gestión de suscripción de café</option>
          <option value="recomendacion">Recomendación de café o molienda</option>
          <option value="mayorista">Ventas mayoristas o empresas</option>
          <option value="otro">Otro asunto</option>
        </select>
      </div>

      <div>
        <Label htmlFor="contact-message" className="text-xs">
          Mensaje <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="contact-message"
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
          placeholder="Cuéntanos cómo podemos ayudarte..."
          className="mt-1 flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full gap-2">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {isPending ? "Enviando mensaje..." : "Enviar mensaje"}
      </Button>
    </form>
  );
}

