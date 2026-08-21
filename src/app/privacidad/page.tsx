import React from 'react';

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-[#E0E0E0] py-12 px-6">
      <div className="max-w-4xl mx-auto bg-[#1E1E1E] p-8 rounded-xl border border-[#2C2C2C]">
        <h1 className="text-3xl font-bold text-[#81C784] mb-6">Política de Privacidad y Tratamiento de Datos</h1>
        <p className="mb-4 text-sm text-[#9E9E9E]">Última actualización: 20 de agosto de 2026</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#81C784] mb-2">1. Información que Recolectamos</h2>
          <p className="leading-relaxed mb-3">
            Para la correcta operación del ecosistema Libora, recolectamos y tratamos los siguientes datos personales:
          </p>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><strong>Información de Registro:</strong> Correo electrónico proporcionado al crear una cuenta.</li>
            <li><strong>Datos de Localización (GPS):</strong> Ubicación geográfica precisa del dispositivo móvil para que los generadores puedan publicar solicitudes de recolección y los recolectores puedan ubicarlas en tiempo real en base a la cercanía.</li>
            <li><strong>Direcciones Blockchain:</strong> La dirección de la billetera criptográfica generada para las transacciones on-chain de EcoTokens.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#81C784] mb-2">2. Finalidad del Tratamiento de Datos</h2>
          <p className="leading-relaxed">
            Los datos son recolectados exclusivamente para: permitir la trazabilidad del material reciclado, despachar notificaciones push a través de Firebase (FCM), enviar correos transaccionales mediante Brevo, calcular recompensas on-chain y optimizar la logística de recolección en calle.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#81C784] mb-2">3. Derechos de los Usuarios y Cumplimiento GDPR</h2>
          <p className="leading-relaxed">
            De acuerdo con el Reglamento General de Protección de Datos (GDPR) y normativas locales, usted tiene derecho a acceder, rectificar o eliminar su cuenta de manera irreversible. Al solicitar la eliminación de su cuenta desde la aplicación móvil, Libora anonimiza su correo electrónico y destruye sus tokens FCM, claves privadas cifradas y PINs, preservando únicamente las transacciones del historial para auditar la masa de material.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#81C784] mb-2">4. Seguridad de la Información</h2>
          <p className="leading-relaxed">
            Las claves privadas de las billeteras se almacenan encriptadas simétricamente en el backend mediante el estándar industrial AES-256-GCM. No se permite la visualización ni exportación de la clave sin autorización expresa.
          </p>
        </section>

        <footer className="mt-8 pt-6 border-t border-[#2C2C2C] text-center text-sm text-[#757575]">
          <p>&copy; 2026 Libora. Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}
