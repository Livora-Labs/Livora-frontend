# Livora Frontend

Demo navegable de los paneles administrativo y corporativo B2B de Livora. Usa Next.js, TypeScript y datos locales compatibles con los modelos principales de Prisma.

## Ejecutar

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`. La portada permite acceder como administrador Livora o empresa B2B. No se requieren credenciales reales.

## Rutas principales

- `/admin`: operaciones, lotes, certificados, inventario, KYC y blockchain.
- `/company`: impacto ESG, certificados, compras y trazabilidad.

## Datos

Los tipos están en `src/lib/types.ts` y siguen los modelos del API. Los datos de presentación viven en `src/lib/data.ts`. Los campos `trace`, `saleId`, `consolidatedBatchId` y `txHash` completan visualmente la cadena de custodia prevista, pero aún requieren persistencia/endpoints equivalentes en el backend real.

Configura `.env.local` a partir de `.env.example` cuando se conecte la API. Actualmente `NEXT_PUBLIC_DATA_SOURCE=mock` documenta el modo demo.
