import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getBrewGuide } from "@/lib/data/static";
import { remoteImage } from "@/lib/remote-image";
import { BrewGuide } from "@/components/storefront/brew-guide";
import { Gauge, Timer } from "lucide-react";

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
  const cover = remoteImage(guide.coverUrl);

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
        <div className="mt-5 flex justify-center gap-5 text-sm text-muted-foreground">
          {guide.totalTime && (
            <span className="inline-flex items-center gap-1.5">
              <Timer className="size-4" aria-hidden /> {guide.totalTime}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="size-4" aria-hidden /> {guide.difficulty}
          </span>
        </div>
      </header>

      {cover && (
        <div className="relative mt-10 aspect-[16/9] rounded-lg bg-muted overflow-hidden">
          <Image
            src={cover.src}
            unoptimized={cover.unoptimized}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <BrewGuide recipe={guide.recipe ?? null} steps={guide.steps} />
    </div>
  );
}
