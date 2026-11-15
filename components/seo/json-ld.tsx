/**
 * Inserta datos estructurados schema.org. Se escapa `<` para que ningún texto
 * editable por la tienda (nombre de producto, descripción) pueda cerrar la
 * etiqueta <script>.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
