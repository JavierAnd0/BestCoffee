"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mpConnectAction } from "@/lib/actions/mercadopago";

export function MercadoPagoConnectButton({
  connected,
  result = null,
}: {
  connected: boolean;
  /** Resultado al volver de autorizar en MercadoPago. */
  result?: "connected" | "error" | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    const result = await mpConnectAction();
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    // Misma pestaña: MercadoPago devuelve al panel con ?mp=connected y la
    // página ya muestra la cuenta conectada, sin recargar a mano.
    window.location.assign(result.url);
  };

  return (
    <div className="space-y-2">
      {connected ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" />
          MercadoPago conectado
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Te llevaremos a MercadoPago para que autorices la conexión. Al terminar vuelves aquí.
        </p>
      )}

      {result === "connected" && connected && (
        <p role="status" className="text-xs text-emerald-700">
          Listo: tu tienda ya cobra con MercadoPago.
        </p>
      )}
      {result === "error" && (
        <p role="alert" className="text-xs text-red-600">
          No se pudo conectar MercadoPago. Vuelve a intentarlo; si sigue fallando, escríbenos.
        </p>
      )}

      <Button
        variant={connected ? "outline" : "default"}
        size="sm"
        disabled={loading}
        onClick={handleConnect}
      >
        {loading && <Loader2 className="size-4 animate-spin mr-2" />}
        
        {connected ? "Reconectar MercadoPago" : "Conectar MercadoPago"}
      </Button>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
