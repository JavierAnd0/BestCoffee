import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getCurrentOperator } from "@/lib/data/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const operator = await getCurrentOperator();
  if (!operator) {
    redirect("/acceso");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar operator={operator} />
      <div className="flex-1 min-w-0 bg-muted/30">
        <main className="max-w-7xl mx-auto p-8">{children}</main>
      </div>
    </div>
  );
}
