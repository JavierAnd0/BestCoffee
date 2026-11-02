"use client";

import { useState, useTransition } from "react";
import { Check, X, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/stars";
import { moderateReviewAction } from "@/lib/actions/admin-mutations";
import type { AdminReview } from "@/lib/mocks/admin";

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

const TABS = [
  { key: "PENDING", label: "Pendientes" },
  { key: "APPROVED", label: "Aprobadas" },
  { key: "REJECTED", label: "Rechazadas" },
  { key: "ALL", label: "Todas" },
] as const;

export function AdminReviewsClient({ initialReviews }: { initialReviews: AdminReview[] }) {
  const [reviews, setReviews] = useState<AdminReview[]>(initialReviews);
  const [filter, setFilter] = useState<(typeof TABS)[number]["key"]>("PENDING");
  const [isPending, startTransition] = useTransition();

  const handleModerate = (id: string, status: "APPROVED" | "REJECTED") => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    startTransition(async () => {
      await moderateReviewAction(id, status);
    });
  };

  const filtered =
    filter === "ALL" ? reviews : reviews.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={
              "rounded-md px-3 py-1.5 transition-colors cursor-pointer " +
              (filter === t.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
            No hay reseñas en esta categoría.
          </div>
        ) : (
          filtered.map((r) => (
            <article
              key={r.id}
              className="rounded-lg border border-border bg-background p-5"
            >
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
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleModerate(r.id, "APPROVED")}
                  >
                    <Check className="size-3.5" />
                    Aprobar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    className="text-destructive"
                    onClick={() => handleModerate(r.id, "REJECTED")}
                  >
                    <X className="size-3.5" />
                    Rechazar
                  </Button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

