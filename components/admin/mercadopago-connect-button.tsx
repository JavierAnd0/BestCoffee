"use client";

import { useState } from "react";
import { Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mpConnectAction } from "@/lib/actions/mercadopago";

export function MercadoPagoConnectButton({
  connected,
}: {
  connected: boolean;
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
    window.open(result.url, "_blank", "noopener,noreferrer");
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
          Conecta tu cuenta de MercadoPago para recibir pagos con tarjeta en el checkout.
        </p>
      )}

      <Button
        variant={connected ? "outline" : "default"}
        size="sm"
        disabled={loading}
        onClick={handleConnect}
      >
        {loading && <Loader2 className="size-4 animate-spin mr-2" />}
        <ExternalLink className="size-4 mr-2" />
        {connected ? "Reconectar MercadoPago" : "Conectar MercadoPago"}
      </Button>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
