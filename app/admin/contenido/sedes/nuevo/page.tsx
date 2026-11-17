import type { Metadata } from "next";
import { SectionHeader } from "../../_components/fields";
import { LocationForm } from "../location-form";

export const metadata: Metadata = { title: "Nueva sede · Admin" };

export default function NewLocationPage() {
  return (
    <div>
      <SectionHeader title="Nueva sede" />
      <LocationForm />
    </div>
  );
}
