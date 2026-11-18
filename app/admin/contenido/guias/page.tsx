import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Coffee, ExternalLink, Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAdminBrewGuides, type AdminBrewGuide } from "@/lib/data/admin-content";
import { deleteBrewGuideAction } from "@/lib/actions/admin-content";
import { remoteImage } from "@/lib/remote-image";
import { humanDuration, ratio, totalSeconds } from "@/lib/brew";
import { LoadError } from "../_components/fields";
import { ActionButton } from "../_components/row-actions";

export const metadata: Metadata = { title: "Guías · Contenido · Admin" };

export default async function AdminGuidesPage() {
  const res = await listAdminBrewGuides();
  const newButton = (
    <Button
      render={
        <Link href="/admin/contenido/guias/nuevo">
          <Plus className="size-4" />
          Nueva guía
        </Link>
      }
    />
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Guías de preparación</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Recetas paso a paso con temporizador, para que tus clientes preparen tu café en casa como en tu barra.
          </p>
        </div>
        {res.ok && res.data.length > 0 && newButton}
      </div>

      {!res.ok ? (
        <LoadError error={res.error} />
      ) : res.data.length === 0 ? (
        <div className="rounded-lg border border-border bg-background px-6 py-16 text-center">
          <Coffee className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">Enseña a preparar tu café</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Elige un método (V60, Chemex, AeroPress, prensa…) y te dejamos la receta y los pasos listos para ajustar.
          </p>
          <div className="mt-6 flex justify-center">{newButton}</div>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {res.data.map((g) => (
            <GuideCard key={g.id} guide={g} />
          ))}
        </ul>
      )}
    </div>
  );
}

function GuideCard({ guide: g }: { guide: AdminBrewGuide }) {
  const cover = remoteImage(g.coverUrl);
  const total = totalSeconds(g.steps);
  const r = g.recipe ? ratio(g.recipe) : null;
  const name = g.method || g.title;
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-foreground/30">
      <div className="relative aspect-[16/9] bg-muted">
        {cover ? (
          <Image src={cover.src} unoptimized={cover.unoptimized} alt="" fill sizes="(min-width: 1280px) 33vw, 50vw" className="object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-muted-foreground/50">
            <Coffee className="size-7" aria-hidden />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/admin/contenido/guias/${g.id}`}
          className="font-display text-xl font-semibold tracking-tight underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-[var(--accent)]"
        >
          {name}
        </Link>
        {g.summary && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.summary}</p>}
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{g.steps.length} {g.steps.length === 1 ? "paso" : "pasos"}</span>
          {total > 0 && (
            <span className="inline-flex items-center gap-1">
              <Timer className="size-3" /> {humanDuration(total)}
            </span>
          )}
          <span>{g.difficulty}</span>
          {r && <span className="tabular-nums">{r}</span>}
        </p>
        <div className="relative z-10 mt-4 flex items-center gap-1 border-t border-border pt-3">
          <Button
            size="sm"
            variant="ghost"
            render={
              <Link href={`/guias/${g.slug}`} target="_blank" aria-label={`Ver la guía ${name} en la tienda`}>
                <ExternalLink className="size-3.5" />
                Ver en la tienda
              </Link>
            }
          />
          <span className="ml-auto">
            <ActionButton
              label="Borrar"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              confirmText={`¿Borrar la guía "${name}"? No se puede deshacer.`}
              action={deleteBrewGuideAction.bind(null, g.id)}
            />
          </span>
        </div>
      </div>
    </li>
  );
}
