import type { Metadata } from "next";
import { SectionHeader } from "../../_components/fields";
import { GuideForm } from "../guide-form";

export const metadata: Metadata = { title: "Nueva guía · Admin" };

export default function NewGuidePage() {
  return (
    <div>
      <SectionHeader title="Nueva guía" />
      <GuideForm />
    </div>
  );
}
