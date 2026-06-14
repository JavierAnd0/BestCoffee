import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos de uso · ORÍGEN" };

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20">
      <header className="mb-12">
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="font-display font-semibold tracking-tight text-4xl lg:text-5xl">
          Términos de uso
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Última actualización: 1 de enero de 2026
        </p>
      </header>

      <div className="prose prose-sm max-w-none space-y-8 text-foreground/90 leading-relaxed">

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">1. Aceptación de los términos</h2>
          <p>
            Al acceder y utilizar el sitio web de ORÍGEN Café S.A.S. ("ORÍGEN", "nosotros" o "nuestro"),
            ubicado en <strong>orígen.co</strong>, aceptas quedar vinculado por estos Términos de uso. Si no
            estás de acuerdo con alguna parte de estos términos, no deberás usar nuestros servicios.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">2. Descripción del servicio</h2>
          <p>
            ORÍGEN es una tienda en línea de café de especialidad colombiano. Ofrecemos la venta de café
            en grano y molido, suscripciones de entrega periódica, guías de preparación y contenido
            educativo relacionado con el mundo del café.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">3. Cuenta de usuario</h2>
          <p>
            Para realizar compras o gestionar una suscripción deberás crear una cuenta. Eres responsable
            de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo
            tu cuenta. Notifícanos inmediatamente si sospechas de algún uso no autorizado.
          </p>
          <p>
            Debes tener al menos 18 años para crear una cuenta. Al registrarte confirmas que la información
            proporcionada es veraz y actualizada.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">4. Pedidos y pagos</h2>
          <p>
            Todos los precios están expresados en pesos colombianos (COP) e incluyen IVA cuando aplique.
            Nos reservamos el derecho de modificar precios en cualquier momento. Los pedidos confirmados
            se rigen por el precio vigente al momento de la compra.
          </p>
          <p>
            Aceptamos los métodos de pago indicados en el proceso de compra. ORÍGEN no almacena datos de
            tarjetas de crédito o débito; el procesamiento se realiza a través de pasarelas de pago certificadas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">5. Envíos y entregas</h2>
          <p>
            Los tiempos de entrega son estimados y pueden variar según la ciudad y la disponibilidad del
            transportador. ORÍGEN no se hace responsable de demoras ocasionadas por causas fuera de
            nuestro control (fuerza mayor, huelgas, eventos climáticos, etc.).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">6. Política de devoluciones</h2>
          <p>
            Aceptamos devoluciones dentro de los 5 días hábiles siguientes a la recepción del pedido,
            siempre que el producto se encuentre sin abrir y en su empaque original. Los productos
            perecederos o abiertos no son elegibles para devolución salvo defecto de fabricación.
          </p>
          <p>
            Para iniciar una devolución escríbenos a <strong>hola@origen.co</strong> con el número de
            pedido y el motivo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">7. Suscripciones</h2>
          <p>
            Las suscripciones se renuevan automáticamente en el período seleccionado. Puedes pausar,
            modificar o cancelar tu suscripción en cualquier momento desde tu cuenta, sin penalización.
            La cancelación aplica a partir del siguiente ciclo de facturación.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">8. Propiedad intelectual</h2>
          <p>
            Todo el contenido del sitio —textos, imágenes, logotipos, videos y diseños— es propiedad
            exclusiva de ORÍGEN Café S.A.S. o de sus respectivos titulares. Queda prohibida su reproducción,
            distribución o modificación sin autorización expresa por escrito.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">9. Limitación de responsabilidad</h2>
          <p>
            ORÍGEN no será responsable por daños indirectos, incidentales o consecuentes derivados del uso
            o la imposibilidad de uso de nuestros servicios. Nuestra responsabilidad máxima se limita al
            valor del pedido en cuestión.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">10. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de actualizar estos términos en cualquier momento. Te notificaremos
            por correo electrónico o mediante un aviso en el sitio ante cambios significativos. El uso
            continuado del servicio después de la notificación constituye aceptación de los nuevos términos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">11. Ley aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se
            someterá a los tribunales competentes de la ciudad de Bogotá D.C.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">12. Contacto</h2>
          <p>
            Para preguntas sobre estos términos puedes escribirnos a{" "}
            <strong>legal@origen.co</strong> o llamarnos al <strong>+57 601 000 0000</strong>.
          </p>
        </section>

      </div>
    </div>
  );
}
