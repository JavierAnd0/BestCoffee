"use client";

import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoiceActions() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <Button onClick={handlePrint} size="sm" className="gap-2">
        <Printer className="size-4" />
        Imprimir factura
      </Button>
      <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
        <Download className="size-4" />
        Guardar PDF
      </Button>
    </div>
  );
}

