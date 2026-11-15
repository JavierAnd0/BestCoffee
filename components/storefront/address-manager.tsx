"use client";

import { useState, useTransition } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Phone,
  Building,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { ColombiaLocationSelector } from "./colombia-location-selector";
import { findDepartmentForCity } from "@/lib/data/colombia";
import type { MockAddress } from "@/lib/mocks/account";
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/lib/actions/address";

interface AddressManagerProps {
  initialAddresses: MockAddress[];
}

interface FormState {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  label: "Casa",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  phone: "",
  isDefault: false,
};

export function AddressManager({ initialAddresses }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<MockAddress[]>(initialAddresses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<MockAddress | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Actualizar la lista local cuando cambian las props iniciales (ej. revalidación del servidor)
  if (initialAddresses !== addresses && !isPending && addresses.length === 0 && initialAddresses.length > 0) {
    setAddresses(initialAddresses);
  }

  function handleOpenCreate() {
    setEditingAddress(null);
    setFormData({
      ...EMPTY_FORM,
      isDefault: addresses.length === 0, // si es la primera, marcarla predeterminada
    });
    setFormError(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(addr: MockAddress) {
    setEditingAddress(addr);
    const resolvedState = addr.state || (addr.city ? findDepartmentForCity(addr.city) : "") || "";
    setFormData({
      label: addr.label || "Casa",
      line1: addr.line1 || addr.line || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: resolvedState,
      postalCode: addr.postalCode || "",
      phone: addr.phone || "",
      isDefault: !!addr.isDefault,
    });
    setFormError(null);
    setIsDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!formData.line1.trim()) {
      setFormError("La dirección principal es obligatoria.");
      return;
    }
    if (!formData.state.trim()) {
      setFormError("El departamento es obligatorio.");
      return;
    }
    if (!formData.city.trim()) {
      setFormError("La ciudad es obligatoria.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("label", formData.label.trim() || "Casa");
      fd.append("line1", formData.line1.trim());
      if (formData.line2.trim()) fd.append("line2", formData.line2.trim());
      fd.append("city", formData.city.trim());
      if (formData.state.trim()) fd.append("state", formData.state.trim());
      if (formData.postalCode.trim()) fd.append("postalCode", formData.postalCode.trim());
      if (formData.phone.trim()) fd.append("phone", formData.phone.trim());
      if (formData.isDefault) fd.append("isDefault", "true");

      if (editingAddress) {
        // Actualizar dirección
        const res = await updateAddressAction(editingAddress.id, null, fd);
        if (res?.error) {
          setFormError(res.error);
          return;
        }

        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingAddress.id) {
              return {
                ...a,
                label: formData.label.trim() || "Casa",
                line1: formData.line1.trim(),
                line2: formData.line2.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                postalCode: formData.postalCode.trim(),
                phone: formData.phone.trim(),
                isDefault: formData.isDefault,
                line: `${formData.line1.trim()}${formData.line2 ? `, ${formData.line2.trim()}` : ""}${formData.city ? `, ${formData.city.trim()}` : ""}`,
              };
            }
            if (formData.isDefault) {
              return { ...a, isDefault: false };
            }
            return a;
          })
        );

        toast({
          title: "Dirección actualizada",
          description: "Los cambios se han guardado exitosamente.",
        });
        setIsDialogOpen(false);
      } else {
        // Crear dirección
        const res = await createAddressAction(null, fd);
        if (res?.error) {
          setFormError(res.error);
          return;
        }

        const newId = `addr_${Date.now()}`;
        const newAddress: MockAddress = {
          id: newId,
          label: formData.label.trim() || "Casa",
          line1: formData.line1.trim(),
          line2: formData.line2.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          phone: formData.phone.trim(),
          isDefault: formData.isDefault || addresses.length === 0,
          line: `${formData.line1.trim()}${formData.line2 ? `, ${formData.line2.trim()}` : ""}${formData.city ? `, ${formData.city.trim()}` : ""}`,
        };

        setAddresses((prev) => {
          if (newAddress.isDefault) {
            return [newAddress, ...prev.map((a) => ({ ...a, isDefault: false }))];
          }
          return [...prev, newAddress];
        });

        toast({
          title: "Dirección agregada",
          description: "Tu nueva dirección de envío ha sido guardada.",
        });
        setIsDialogOpen(false);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta dirección?")) return;

    startTransition(async () => {
      const res = await deleteAddressAction(id);
      if (res?.error) {
        toast({
          title: "Error al eliminar",
          description: res.error,
        });
        return;
      }

      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: "Dirección eliminada",
        description: "La dirección fue retirada de tu cuenta.",
      });
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const res = await setDefaultAddressAction(id);
      if (res?.error) {
        toast({
          title: "Error al actualizar",
          description: res.error,
        });
        return;
      }

      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );

      toast({
        title: "Dirección predeterminada",
        description: "Esta dirección se usará automáticamente en el checkout.",
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Botón superior de agregar dirección */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {addresses.length === 1
            ? "1 dirección guardada"
            : `${addresses.length} direcciones guardadas`}
        </p>
        <Button onClick={handleOpenCreate} size="sm" className="gap-2">
          <Plus className="size-4" />
          Nueva dirección
        </Button>
      </div>

      {/* Lista de direcciones o Estado vacío */}
      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-6" />}
          title="No tienes direcciones registradas"
          description="Agrega la dirección donde prefieres recibir tus paquetes de café y entregas programadas."
          action={
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="size-4" />
              Agregar primera dirección
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {addresses.map((a) => {
            const displayAddress =
              a.line1 ||
              a.line ||
              "Sin dirección especificada";
            const details = [a.line2, a.city, a.state, a.postalCode]
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={a.id}
                className="relative rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base flex items-center gap-1.5">
                        <Building className="size-4 text-muted-foreground" />
                        {a.label || "Dirección"}
                      </span>
                      {a.isDefault && (
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary border-primary/20 text-xs font-normal"
                        >
                          Predeterminada
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground mt-2">
                    {displayAddress}
                  </p>
                  {details && (
                    <p className="text-xs text-muted-foreground mt-1">{details}</p>
                  )}
                  {a.phone && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Phone className="size-3" /> {a.phone}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/60">
                  {!a.isDefault ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSetDefault(a.id)}
                      className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="size-3" />
                      Marcar predeterminada
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Principal para envíos
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleOpenEdit(a)}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(a.id)}
                      className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Agregar o Editar Dirección */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold">
              {editingAddress ? "Editar dirección" : "Agregar dirección de envío"}
            </DialogTitle>
            <DialogDescription>
              Completa los datos de tu ubicación para tus entregas de café y pedidos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <Label htmlFor="addr-label" className="text-xs">
                Nombre de la dirección (ej. Casa, Oficina, Finca)
              </Label>
              <Input
                id="addr-label"
                value={formData.label}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="Ej. Casa"
                className="mt-1"
                maxLength={40}
              />
            </div>

            <div>
              <Label htmlFor="addr-line1" className="text-xs">
                Dirección principal <span className="text-destructive">*</span>
              </Label>
              <Input
                id="addr-line1"
                required
                value={formData.line1}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, line1: e.target.value }))
                }
                placeholder="Ej. Calle 10 # 43E - 12"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="addr-line2" className="text-xs">
                Apartamento, interior, torre o referencia (opcional)
              </Label>
              <Input
                id="addr-line2"
                value={formData.line2}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, line2: e.target.value }))
                }
                placeholder="Ej. Apto 402, Torre B"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ColombiaLocationSelector
                department={formData.state}
                city={formData.city}
                onDepartmentChange={(state) =>
                  setFormData((prev) => ({ ...prev, state }))
                }
                onCityChange={(city) =>
                  setFormData((prev) => ({ ...prev, city }))
                }
                variant="dialog"
                departmentId="addr-state"
                cityId="addr-city"
                required={true}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="addr-postalCode" className="text-xs">
                  Código postal
                </Label>
                <Input
                  id="addr-postalCode"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, postalCode: e.target.value }))
                  }
                  placeholder="Ej. 050021"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="addr-phone" className="text-xs">
                  Teléfono de contacto
                </Label>
                <Input
                  id="addr-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Ej. +57 300 123 4567"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="addr-default"
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))
                }
                className="size-4 rounded border-input text-primary focus:ring-primary/20 accent-primary"
              />
              <Label
                htmlFor="addr-default"
                className="text-xs text-foreground cursor-pointer"
              >
                Establecer como dirección de entrega predeterminada
              </Label>
            </div>

            <DialogFooter className="pt-4 mt-6">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {editingAddress ? "Guardar cambios" : "Guardar dirección"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

