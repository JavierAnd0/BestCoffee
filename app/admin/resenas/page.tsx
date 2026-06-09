import type { Metadata } from "next";
import { Check, X, MessageSquare, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { Stars } from "@/components/ui/stars";
import { listPendingReviews } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Reseñas · Admin" };

const STATUS_TONE = {
  PENDING: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
} as const;

const STATUS_LABEL = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
} as const;

export default async function AdminReviewsPage() {
  const reviews = await listPendingReviews();
  const pending = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseñas"
        description={`${pending} pendientes de aprobación · ${reviews.length} totales`}
      />

      <div className="flex gap-2 text-xs">
        {["Pendientes", "Aprobadas", "Rechazadas", "Todas"].map((t, i) => (
          <button
            key={t}
            className={
              "rounded-md px-3 py-1.5 transition-colors " +
              (i === 0 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <article key={r.id} className="rounded-lg border border-border bg-background p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="size-8 rounded-full bg-foreground/10 grid place-items-center text-xs font-semibold">
                    {r.customerName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{r.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.createdAt} · sobre {r.productName}
                    </div>
                  </div>
                  {r.verifiedSubscriber && (
                    <Badge variant="outline" className="font-normal text-[10px]">
                      <ShieldCheck className="size-3" />
                      Suscriptor verificado
                    </Badge>
                  )}
                </div>
                <div className="mb-3">
                  <Stars value={r.rating} size={14} />
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed max-w-2xl">
                  {r.body}
                </p>
              </div>
              <Badge variant="outline" className={STATUS_TONE[r.status]}>
                {STATUS_LABEL[r.status]}
              </Badge>
            </div>

            {r.status === "PENDING" && (
              <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-border">
                <Button size="sm">
                  <Check className="size-3.5" />
                  Aprobar
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="size-3.5" />
                  Responder
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <X className="size-3.5" />
                  Rechazar
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
