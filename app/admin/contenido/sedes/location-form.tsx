"use client";

import { saveLocationAction } from "@/lib/actions/admin-content";
import { useContentForm } from "../_components/use-content-form";
import type { AdminLocation } from "@/lib/data/admin-content";
import { FormError, FormSection, TextField, locationHoursText } from "../_components/fields";
import { FormActions } from "../_components/submit-button";
import { MapLocationField } from "./map-location-field";

export function LocationForm({ location, inPanel }: { location?: AdminLocation; inPanel?: boolean }) {
  const { error, onSubmit, pending } = useContentForm(saveLocationAction);
  return (
    <form onSubmit={onSubmit} className={inPanel ? "space-y-8" : "space-y-6 max-w-3xl"}>
      {location && <input type="hidden" name="id" value={location.id} />}
      <FormError error={error} />
      <FormSection plain={inPanel}>
        <TextField label="Nombre" name="name" required maxLength={120} defaultValue={location?.name} placeholder="Sede principal" />
        <div className="grid sm:grid-cols-[2fr_1fr] gap-4">
          <TextField label="Dirección" name="address" required maxLength={200} defaultValue={location?.address} />
          <TextField label="Ciudad" name="city" required maxLength={80} defaultValue={location?.city} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Teléfono (opcional)" name="phone" type="tel" maxLength={40} defaultValue={location?.phone ?? ""} />
          <TextField
            label="Horario (opcional)"
            name="hours"
            maxLength={200}
            defaultValue={locationHoursText(location?.hours)}
            placeholder="Lun–Sáb · 8:00–18:00"
          />
        </div>
      </FormSection>
      <FormSection plain={inPanel} title="Ubicación en el mapa">
        <MapLocationField lat={location?.lat ?? null} lng={location?.lng ?? null} />
      </FormSection>
      <FormActions
        pending={pending}
        cancelHref="/admin/contenido/sedes"
        keepScroll={inPanel}
        submitLabel={location ? "Guardar cambios" : "Crear sede"}
      />
    </form>
  );
}
