import Link from "next/link";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export function QuizBand() {
  return (
    <section className="bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center gap-5">
        <span className="size-14 rounded-full bg-background border border-border grid place-items-center">
          <Coffee className="size-6" strokeWidth={1.5} />
        </span>
        <Eyebrow>Quiz de recomendación</Eyebrow>
        <h2 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight max-w-xl">
          5 preguntas para encontrar tu café ideal
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Te llevamos en menos de un minuto al café que más se acerca a tu paladar
          y a tu forma de prepararlo.
        </p>
        <Button
          size="lg"
          className="mt-2"
          render={<Link href="/quiz">Hacer el quiz →</Link>}
        />
      </div>
    </section>
  );
}
