# API Spec (Front-end contract)

Estos son los endpoints del backend esperados por el frontend, con ejemplos de request/response (mock) que respetan las shapes del backend.

Base URL: `{{NEXT_PUBLIC_API_BASE_URL}}` (ej. http://localhost:3000)

1) GET /batches
- Query: `?page=1&limit=20&sortBy=createdAt&sortOrder=DESC&status=RECEIVED`
- Response (200):
```json
[
  {
    "id":"11111111-1111-1111-1111-111111111111",
    "status":"RECEIVED",
    "collector": {"id":"u1","email":"collector1@example.com"},
    "destinationCenter": {"id":"c1","email":"center1@example.com"},
    "requests":[{"id":"r1","householdId":"h1","photoUrl":"https://...","latitude":-12.0,"longitude":-77.0}],
    "materialsActual": {"PLASTIC":120.5},
    "createdAt":"2026-07-01T12:00:00.000Z",
    "updatedAt":"2026-07-02T12:00:00.000Z",
    "ipfsCid":"bafy...",
    "txHash":"0x..."
  }
]
```

2) GET /batches/:id
- Response: full Batch object + related info (same shape, possibly additional fields)

3) POST /batches/:id/receive
- Body:
```json
{ "materialsActual": { "PLASTIC": 120.5, "PAPER": 40 } }
```
- Response (202):
```json
{ "status":"PROCESSING", "batchId":"...", "transactionJobId":"1234" }
```

4) POST /consolidated-batches
- Body: `{ "batchIds": ["id1","id2"] }`
- Response: ConsolidatedBatch object

5) GET /certificates? page/limit
- Response: list of certificates for buyer

6) GET /collection-requests?lat=&lng=&radius=
- Response: list of CollectionRequest with lat/lng/photoUrl

7) GET /wallets/me/balance
- Response: `{ "balance": "150.5" }`

Auth: Bearer token from Supabase session

Notas:
- Para demo usar los mocks proporcionados en `/mocks`.
- Cualquier endpoint que devuelva IPFS CID deberá mostrarse como enlace a `https://ipfs.io/ipfs/{cid}` o viewer.
