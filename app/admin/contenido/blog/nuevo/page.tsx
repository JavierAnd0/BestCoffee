import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/data/tenant";
import { SectionHeader } from "../../_components/fields";
import { BlogForm } from "../blog-form";

export const metadata: Metadata = { title: "Nuevo artículo · Admin" };

export default async function NewBlogPostPage() {
  const tenant = await getCurrentTenant().catch(() => null);
  if (tenant && !tenant.features.blog) notFound();
  return (
    <div>
      <SectionHeader title="Nuevo artículo" />
      <BlogForm />
    </div>
  );
}
