import { redirect } from "next/navigation";

export default function SuperadminPage() {
  redirect("/platform/superadmin/tenants");
}
