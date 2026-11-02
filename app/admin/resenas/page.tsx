import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { listPendingReviews } from "@/lib/data/admin";
import { AdminReviewsClient } from "./reviews-client";

export const metadata: Metadata = { title: "Reseñas · Admin" };

export default async function AdminReviewsPage() {
  const reviews = await listPendingReviews();
  const pending = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseñas"
        description={`${pending} pendientes de aprobación · ${reviews.length} totales`}
      />
      <AdminReviewsClient initialReviews={reviews} />
    </div>
  );
}
