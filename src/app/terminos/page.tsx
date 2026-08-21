import React from 'react';

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-[#E0E0E0] py-12 px-6">
      <div className="max-w-4xl mx-auto bg-[#1E1E1E] p-8 rounded-xl border border-[#2C2C2C]">
        <h1 className="text-3xl font-bold text-[#81C784] mb-6">Términos y Condiciones de Uso</h1>
        <p className="mb-4 text-sm text-[#9E9E9E]">Última actualización: 20 de agosto de 2026</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#81C784] mb-2">1. Aceptación de los Términos</h2>
          <p className="leading-relaxed">
            Al registrarse y utilizar la plataforma Libora, usted acepta plenamente estos Términos y Condiciones. Si no está de acuerdo con alguno de ellos, no debe utilizar nuestros servicios.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#81C784] mb-2">2. Roles en la Plataforma</h2>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><strong>Generadores / Hogares:</strong> Usuarios que registran y entregan material reciclable limpio y seco, recibiendo EcoTokens tras la validación física en el centro de acopio.</li>
            <li><strong>Recolectores:</strong> Usuarios independientes responsables de recoger el material en ruta y entregarlo al centro de acopio de su elección.</li>
            <li><strong>Centros de Acopio:</strong> Operadores autorizados que reciben, clasifican, pesan y consolidan el material, emitiendo EcoTokens a recolectores y generadores.</li>
            <li><strong>Tiendas Aliadas:</strong> Comercios locales que aceptan EcoTokens como medio de pago para sus productos y servicios.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#81C784] mb-2">3. Uso del Sistema de Recompensas (EcoTokens)</h2>
          <p className="leading-relaxed">
            Los EcoTokens (ECO) se acuñan y distribuyen de manera descentralizada en la red Arbitrum Sepolia. Representan un incentivo por participación ecológica y pueden ser redimidos en tiendas aliadas. No constituyen una moneda de curso legal ni un activo financiero de inversión.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#81C784] mb-2">4. Limitación de Responsabilidad</h2>
          <p className="leading-relaxed">
            Libora no garantiza la disponibilidad ininterrumpida del servicio blockchain y no se responsabiliza por pérdidas causadas por fallos en redes distribuidas, pérdida de claves privadas por parte de los usuarios custodiales, o interrupciones del nodo RPC.
          </p>
        </section>

        <footer className="mt-8 pt-6 border-t border-[#2C2C2C] text-center text-sm text-[#757575]">
          <p>&copy; 2026 Libora. Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}
