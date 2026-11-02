import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCurrentCustomer } from "@/lib/data/account";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mis datos" };

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <Eyebrow>Tu perfil</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Mis datos
        </h1>
      </header>
      <ProfileForm customer={customer} />
    </div>
  );
}
