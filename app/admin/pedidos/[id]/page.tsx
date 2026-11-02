import type { Metadata } from "next";
import { getAdminOrderDetail } from "@/lib/data/admin";
import { AdminOrderDetailClient } from "./order-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Pedido #${id} · Admin` };
}

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  return <AdminOrderDetailClient order={order} />;
}
