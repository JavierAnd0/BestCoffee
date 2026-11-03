import { createContext, useContext } from "react";

/** Presupuesto de calidad: el móvil recibe menos partículas y menos polígonos. */
export interface Quality {
  mobile: boolean;
  beans: number;
  grounds: number;
  steam: number;
  segments: number;
}

export const DESKTOP_QUALITY: Quality = {
  mobile: false,
  beans: 90,
  grounds: 520,
  steam: 16,
  segments: 64,
};

export const MOBILE_QUALITY: Quality = {
  mobile: true,
  beans: 48,
  grounds: 220,
  steam: 10,
  segments: 36,
};

export const QualityContext = createContext<Quality>(DESKTOP_QUALITY);
export const useQuality = () => useContext(QualityContext);
