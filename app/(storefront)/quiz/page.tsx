import type { Metadata } from "next";
import { QuizWizard } from "@/components/storefront/quiz-wizard";

export const metadata: Metadata = {
  title: "Quiz · Encuentra tu café",
  description:
    "Cinco preguntas para recomendarte el café que más se acerca a tu paladar y tu forma de prepararlo.",
};

export default function QuizPage() {
  return <QuizWizard />;
}
