import { redirect } from "next/navigation";

/** Las sedes se crean en un panel sobre la lista; esta dirección queda para enlaces viejos. */
export default function NewLocationPage() {
  redirect("/admin/contenido/sedes?nuevo=1");
}
