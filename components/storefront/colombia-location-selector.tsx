"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  getColombiaDepartments,
  getCitiesForDepartment,
  findDepartmentForCity,
  normalizeDepartmentName,
} from "@/lib/data/colombia";
import { Label } from "@/components/ui/label";

interface ColombiaLocationSelectorProps {
  department: string;
  city: string;
  onDepartmentChange: (dept: string) => void;
  onCityChange: (city: string) => void;
  variant?: "checkout" | "dialog";
  required?: boolean;
  departmentId?: string;
  cityId?: string;
  disabled?: boolean;
}

export function ColombiaLocationSelector({
  department,
  city,
  onDepartmentChange,
  onCityChange,
  variant = "checkout",
  required = true,
  departmentId = "shipping-region",
  cityId = "shipping-city",
  disabled = false,
}: ColombiaLocationSelectorProps) {
  const departments = getColombiaDepartments();
  const [isCustomCity, setIsCustomCity] = useState(false);

  // Auto-deducir departamento si hay ciudad pero no departamento
  useEffect(() => {
    if (!department && city) {
      const inferredDept = findDepartmentForCity(city);
      if (inferredDept) {
        onDepartmentChange(inferredDept);
      }
    }
  }, [city, department, onDepartmentChange]);

  const canonicalDept = normalizeDepartmentName(department) || department;
  const availableCities = canonicalDept ? getCitiesForDepartment(canonicalDept) : [];

  // Manejar cambio de departamento
  const handleDepartmentSelect = (newDept: string) => {
    onDepartmentChange(newDept);
    setIsCustomCity(false);

    const newCities = getCitiesForDepartment(newDept);
    // Si la ciudad actual no pertenece al nuevo departamento, la limpiamos
    if (city && !newCities.includes(city)) {
      onCityChange("");
    }
  };

  const handleCitySelectChange = (val: string) => {
    if (val === "__custom__") {
      setIsCustomCity(true);
      onCityChange("");
    } else {
      setIsCustomCity(false);
      onCityChange(val);
    }
  };

  const isCheckout = variant === "checkout";

  const renderLabel = (text: string, id: string, isReq: boolean) => {
    if (isCheckout) {
      return (
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          {text} {isReq && <span className="text-destructive">*</span>}
        </span>
      );
    }
    return (
      <Label htmlFor={id} className="text-xs mb-1 block">
        {text} {isReq && <span className="text-destructive">*</span>}
      </Label>
    );
  };

  const selectClass =
    "w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm outline-none transition-colors focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60";
  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-muted/40";

  return (
    <>
      {/* 1. DEPARTAMENTO PRIMERO */}
      <div className="w-full">
        <label htmlFor={departmentId} className="block">
          {renderLabel("Departamento / Región", departmentId, required)}
          <div className="relative">
            <select
              id={departmentId}
              name="region"
              value={canonicalDept}
              disabled={disabled}
              onChange={(e) => handleDepartmentSelect(e.target.value)}
              className={selectClass}
              autoComplete="address-level1"
            >
              <option value="">Selecciona un departamento</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
              {canonicalDept && !departments.includes(canonicalDept) && (
                <option value={canonicalDept}>{canonicalDept}</option>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          </div>
        </label>
      </div>

      {/* 2. CIUDAD A PARTIR DEL DEPARTAMENTO */}
      <div className="w-full">
        <label htmlFor={cityId} className="block">
          {renderLabel("Ciudad", cityId, required)}
          {isCustomCity ? (
            <div className="space-y-1.5">
              <input
                id={cityId}
                name="city"
                type="text"
                value={city}
                disabled={disabled}
                placeholder="Escribe el nombre de tu municipio"
                onChange={(e) => onCityChange(e.target.value)}
                className={inputClass}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsCustomCity(false)}
                className="text-[11px] text-primary underline hover:text-primary/80 transition-colors"
              >
                ← Volver a la lista de ciudades
              </button>
            </div>
          ) : (
            <div className="relative">
              <select
                id={cityId}
                name="city"
                value={city}
                disabled={disabled || !canonicalDept}
                onChange={(e) => handleCitySelectChange(e.target.value)}
                className={selectClass}
                autoComplete="address-level2"
              >
                <option value="">
                  {!canonicalDept
                    ? "Primero selecciona un departamento"
                    : "Selecciona una ciudad"}
                </option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {city && !availableCities.includes(city) && (
                  <option value={city}>{city}</option>
                )}
                {canonicalDept && (
                  <option value="__custom__">Otro municipio o localidad...</option>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            </div>
          )}
        </label>
      </div>
    </>
  );
}
