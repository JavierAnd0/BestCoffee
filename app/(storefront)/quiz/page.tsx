import type { Metadata } from "next";
import { QuizWizard } from "@/components/storefront/quiz-wizard";
import { requireFeature } from "@/lib/data/feature-guard";

export const metadata: Metadata = {
  title: "Quiz · Encuentra tu café",
  description:
    "Cinco preguntas para recomendarte el café que más se acerca a tu paladar y tu forma de prepararlo.",
};

export default async function QuizPage() {
  // El quiz recomienda productos del catálogo.
  await requireFeature("catalog");
  return <QuizWizard />;
}
