# Requisitos funcionales (Frontend) — Livora

Resumen: construir dos dashboards principales (Admin y Buyer) con enfoque web3 (cards, IPFS manifests, tx explorer, token distribution) y compatibilidad con la API existente.

Usuarios y roles:
- Admin: interfaz interna para monitoreo, emisión de certificados, gestión de centros, visualizar batches, forzar reprocesos.
- Buyer (Empresa B2B): ver certificados ESG emitidos, historial de compras, explorar batches recibidos y descargar manifiestos.

Pantallas principales (MVP):
1. Login / Auth (Supabase)
2. Admin Overview: KPIs (volumen, tokens, batches), últimos jobs, lista de alertas
3. Admin Batches (OpenSea style): grid de cards con filtros
4. Batch Detail: muestra manifiesto IPFS, lista de requests, tokens distribuidos, tx hash
5. Buyer Certificates: listado, detalle, descarga de hash
6. Map view: collection requests geolocalizadas
7. Inventory & Sales: vistas simples para centro y buyer

Requerimientos no funcionales:
- Usar la estructura de datos del backend (Prisma models). No almacenar claves privadas en frontend.
- Mock data para demo; endpoints reales cuando el backend esté disponible.
- Soporte para websocket (socket.io) para notificaciones en tiempo real.

Integraciones:
- Supabase Auth
- IPFS viewer (enlace al CID)
- ethers.js para formateo de unidades (wei ↔︎ eth)
- socket.io-client para eventos en tiempo real
