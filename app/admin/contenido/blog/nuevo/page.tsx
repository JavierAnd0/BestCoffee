import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/data/tenant";
import { getSiteUrl } from "@/lib/seo";
import { BlogForm } from "../blog-form";
import { hostOf } from "../host";

export const metadata: Metadata = { title: "Nuevo artículo · Admin" };

export default async function NewBlogPostPage() {
  const tenant = await getCurrentTenant().catch(() => null);
  if (tenant && !tenant.features.blog) notFound();
  const siteUrl = await getSiteUrl();
  return <BlogForm siteHost={hostOf(siteUrl)} />;
}
