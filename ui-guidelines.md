# UI Guidelines — Livora Dashboards

Estética: estilo "marketplace" / OpenSea para explorar lotes y certificados.

Principios de diseño:
- Card-centric: cada `Batch` o `Certificate` se presenta como una tarjeta con imagen, metadata y acciones.
- Colores: paleta sobria, acentos verdes/azules para indicar éxito/estado.
- Badges: estado del lote (OPEN, IN_TRANSIT, PROCESSING, RECEIVED, CONSOLIDATED)
- Grids responsivos: 3 columnas desktop, 1 columna mobile.

Componentes clave:
- `BatchCard`: imagen (photoUrl), id corto, estado badge, peso total, link detalle, tx badge
- `IpfsViewer`: modal para ver JSON del manifiesto desde CID
- `TokenDistribution`: gráfico de pastel mostrando % recolector vs hogares
- `MapView`: mapa con markers para `collection_requests`

Interacciones importantes:
- Filtrado y búsqueda en el grid
- Orden por fecha / estado
- Real-time badge: cuando llega evento `batch:completed`, resaltar tarjeta afectada

Tip: para apariencia OpenSea usar Ant Design `Card` con `Meta` y `Badge` o crear CSS con Tailwind para cards con imagen grande y overlay.
