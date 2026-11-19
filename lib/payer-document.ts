/** Tipos de documento del pagador que acepta ePayco (mismo set que el backend). */
export const PAYER_DOC_TYPES = ["CC", "CE", "NIT", "PPN", "TI"] as const;
export type PayerDocType = (typeof PAYER_DOC_TYPES)[number];

export const PAYER_DOC_LABELS: Record<PayerDocType, string> = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  NIT: "NIT",
  PPN: "Pasaporte",
  TI: "Tarjeta de identidad",
};

/** Número de documento válido para ePayco: 4 a 15 letras o números. */
export const PAYER_DOC_NUMBER = /^[0-9A-Za-z]{4,15}$/;
