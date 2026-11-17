import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminBlogPost } from "@/lib/data/admin-content";
import { getCurrentTenant } from "@/lib/data/tenant";
import { LoadError, SectionHeader } from "../../_components/fields";
import { BlogForm } from "../blog-form";

export const metadata: Metadata = { title: "Editar artículo · Admin" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await getCurrentTenant().catch(() => null);
  if (tenant && !tenant.features.blog) notFound();
  const { id } = await params;
  const res = await getAdminBlogPost(id);
  if (!res.ok && (res.status === 404 || res.status === 402)) notFound();
  if (res.ok && !res.data) notFound();
  return (
    <div>
      <SectionHeader title="Editar artículo" />
      {!res.ok ? <LoadError error={res.error} /> : res.data && <BlogForm post={res.data} />}
    </div>
  );
}
