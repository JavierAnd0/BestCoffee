import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminBlogPost } from "@/lib/data/admin-content";
import { getCurrentTenant } from "@/lib/data/tenant";
import { getSiteUrl } from "@/lib/seo";
import { LoadError } from "../../_components/fields";
import { BlogForm } from "../blog-form";
import { hostOf } from "../host";

export const metadata: Metadata = { title: "Editar artículo · Admin" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await getCurrentTenant().catch(() => null);
  if (tenant && !tenant.features.blog) notFound();
  const { id } = await params;
  const [res, siteUrl] = await Promise.all([getAdminBlogPost(id), getSiteUrl()]);
  if (!res.ok && (res.status === 404 || res.status === 402)) notFound();
  if (res.ok && !res.data) notFound();
  return (
    <div>
      {!res.ok ? (
        <LoadError error={res.error} />
      ) : (
        res.data && <BlogForm post={res.data} siteHost={hostOf(siteUrl)} />
      )}
    </div>
  );
}
