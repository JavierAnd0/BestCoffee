import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getBrewGuide } from "@/lib/data/static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ metodo: string }>;
}): Promise<Metadata> {
  const { metodo } = await params;
  const g = await getBrewGuide(metodo);
  if (!g) return { title: "Guía no encontrada" };
  return { title: `Guía · ${g.method}`, description: g.summary };
}

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ metodo: string }>;
}) {
  const { metodo } = await params;
  const guide = await getBrewGuide(metodo);
  if (!guide) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/guias"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Todas las guías
      </Link>
      <header className="mt-6 text-center">
        <Eyebrow>Guía de preparación</Eyebrow>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          {guide.method}
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          {guide.summary}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Badge variant="outline" className="font-normal">
            ⏱ {guide.totalTime}
          </Badge>
          <Badge variant="outline" className="font-normal">
            {guide.difficulty}
          </Badge>
        </div>
      </header>

      <div className="mt-12 space-y-6">
        {guide.steps.map((s, i) => (
          <article key={i} className="grid grid-cols-[auto_1fr] gap-5">
            <span className="size-10 rounded-full bg-foreground text-background grid place-items-center font-display font-semibold text-base">
              {i + 1}
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {s.title}
              </h2>
              <p className="mt-2 text-base text-foreground/90 leading-relaxed">{s.body}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                {s.durationSec >= 3600
                  ? `${Math.round(s.durationSec / 3600)} h`
                  : s.durationSec >= 60
                    ? `${Math.round(s.durationSec / 60)} min`
                    : `${s.durationSec} s`}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
