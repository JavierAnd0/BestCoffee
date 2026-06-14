import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad · ORÍGEN" };

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20">
      <header className="mb-12">
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="font-display font-semibold tracking-tight text-4xl lg:text-5xl">
          Política de privacidad
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Última actualización: 1 de enero de 2026
        </p>
      </header>

      <div className="prose prose-sm max-w-none space-y-8 text-foreground/90 leading-relaxed">

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">1. Responsable del tratamiento</h2>
          <p>
            ORÍGEN Café S.A.S., con NIT 900.000.000-0, con domicilio en Bogotá D.C., Colombia,
            es el responsable del tratamiento de los datos personales recopilados a través de este sitio web,
            en cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">2. Datos que recopilamos</h2>
          <p>Recopilamos los siguientes datos personales:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Datos de registro:</strong> nombre, apellido, correo electrónico y contraseña.</li>
            <li><strong>Datos de compra:</strong> dirección de entrega, teléfono y método de pago (solo referencia tokenizada).</li>
            <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas y tiempo de sesión.</li>
            <li><strong>Comunicaciones:</strong> mensajes que nos envíes por correo o formularios de contacto.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">3. Finalidades del tratamiento</h2>
          <p>Usamos tus datos para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gestionar tu cuenta y procesar tus pedidos y suscripciones.</li>
            <li>Enviarte confirmaciones de compra, actualizaciones de envío y facturas.</li>
            <li>Brindarte soporte al cliente.</li>
            <li>Enviarte comunicaciones de marketing cuando hayas dado tu consentimiento.</li>
            <li>Mejorar nuestros productos, servicios y la experiencia en el sitio.</li>
            <li>Cumplir obligaciones legales y contables.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">4. Base legal del tratamiento</h2>
          <p>
            El tratamiento de tus datos se basa en: (i) la ejecución del contrato de compraventa o
            suscripción, (ii) tu consentimiento explícito cuando aplique, y (iii) el cumplimiento de
            obligaciones legales a las que está sujeta ORÍGEN.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">5. Compartición de datos</h2>
          <p>
            No vendemos ni cedemos tus datos personales a terceros con fines comerciales. Podemos
            compartirlos únicamente con:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Transportadores:</strong> para gestionar la entrega de tus pedidos.</li>
            <li><strong>Pasarelas de pago:</strong> para procesar transacciones de forma segura.</li>
            <li><strong>Proveedores de tecnología:</strong> que nos ayudan a operar el sitio bajo estrictos acuerdos de confidencialidad.</li>
            <li><strong>Autoridades:</strong> cuando exista obligación legal de hacerlo.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">6. Cookies y tecnologías similares</h2>
          <p>
            Utilizamos cookies propias y de terceros para el funcionamiento del sitio, análisis de tráfico
            y personalización de contenido. Puedes gestionar tus preferencias de cookies desde la
            configuración de tu navegador. El bloqueo de cookies esenciales puede afectar la funcionalidad
            del sitio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">7. Conservación de datos</h2>
          <p>
            Conservamos tus datos durante el tiempo que mantengas una cuenta activa y por el período
            adicional requerido por la legislación colombiana (mínimo 10 años para registros contables).
            Los datos de marketing se eliminan si retiras tu consentimiento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">8. Tus derechos</h2>
          <p>
            De conformidad con la Ley 1581 de 2012, tienes derecho a:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Conocer</strong> los datos personales que tenemos sobre ti.</li>
            <li><strong>Actualizar y rectificar</strong> datos inexactos o incompletos.</li>
            <li><strong>Suprimir</strong> tus datos cuando no sean necesarios para las finalidades declaradas.</li>
            <li><strong>Revocar</strong> el consentimiento otorgado.</li>
            <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC).</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos escríbenos a <strong>privacidad@origen.co</strong>
            {" "}indicando tu nombre completo, correo registrado y la solicitud específica. Responderemos
            en un plazo máximo de 15 días hábiles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">9. Seguridad</h2>
          <p>
            Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos contra
            acceso no autorizado, pérdida o divulgación. Las contraseñas se almacenan con hash seguro
            y las comunicaciones se cifran mediante TLS.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">10. Transferencias internacionales</h2>
          <p>
            Algunos de nuestros proveedores de tecnología pueden procesar datos fuera de Colombia.
            En esos casos exigimos garantías contractuales equivalentes a las establecidas por la
            legislación colombiana.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">11. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política periódicamente. Te notificaremos por correo electrónico
            ante cambios relevantes. La versión vigente siempre estará disponible en esta página.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-semibold text-xl text-foreground">12. Contacto</h2>
          <p>
            Para cualquier consulta sobre esta política o el tratamiento de tus datos personales,
            contáctanos en <strong>privacidad@origen.co</strong>.
          </p>
        </section>

      </div>
    </div>
  );
}
