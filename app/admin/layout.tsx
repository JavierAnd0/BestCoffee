import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 min-w-0 bg-muted/30">
        <main className="max-w-7xl mx-auto p-8">{children}</main>
      </div>
    </div>
  );
}
