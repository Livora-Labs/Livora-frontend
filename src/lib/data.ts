import type {
  Batch,
  Certificate,
  ConsolidatedBatch,
  InventoryItem,
  KycApplication,
  Sale,
} from "./types";

export const batches: Batch[] = [
  {
    id: "7b2d19e8-6f71-4af0-9428-32e064c26a11",
    status: "RECEIVED",
    collectorId: "a27b44ad-a4c5-4b86-a743-683bbcfb7c11",
    destinationCenterId: "c0a80101-0000-4000-8000-000000000001",
    materialsActual: { PET: 128.5, CARTON: 42 },
    createdAt: "2026-08-07T10:20:00Z",
    updatedAt: "2026-08-07T16:45:00Z",
    collector: {
      id: "a27b44ad-a4c5-4b86-a743-683bbcfb7c11",
      email: "luis.recicla@livora.pe",
    },
    destinationCenter: {
      id: "c0a80101-0000-4000-8000-000000000001",
      email: "acopio.callao@livora.pe",
    },
    requests: [
      {
        id: "8a8f1d65-31e7-4217-bd40-42c1955b4910",
        status: "COMPLETED",
        itemsEstimated: { PET: 60 },
        photoUrl: "",
        description: "Botellas PET limpias y compactadas",
        latitude: -12.0464,
        longitude: -77.0428,
        householdId: "eac5de37-39b2-444a-8890-1f401b0c93d0",
        createdAt: "2026-08-06T09:10:00Z",
      },
      {
        id: "ad01c927-50e2-434b-a25d-fca11d3e8942",
        status: "COMPLETED",
        itemsEstimated: { PET: 68.5, CARTON: 42 },
        photoUrl: "",
        description: "Material separado en origen",
        latitude: -12.0621,
        longitude: -77.0365,
        householdId: "944cc8d9-a964-4887-baa5-1f6c9cc408ab",
        createdAt: "2026-08-06T11:35:00Z",
      },
    ],
    trace: {
      ipfsCid: "bafybeig7livora2m4n6xkqhwnhtraza8c91esgpet",
      txHash: "0x8f21a04998d4b88e21f7cd81d760359ecd72c6fd3cc9d2a6df5fa57a821",
      jobId: "JOB-2841",
      processedAt: "2026-08-07T16:45:00Z",
    },
  },
  {
    id: "b9a69327-966b-44c0-b65a-cd10a4265aba",
    status: "PROCESSING",
    collectorId: "51dcf655-dae7-48a6-afc8-67cd5246db33",
    destinationCenterId: "c0a80101-0000-4000-8000-000000000001",
    materialsActual: { HDPE: 76, ALUMINIO: 18.2 },
    createdAt: "2026-08-07T08:05:00Z",
    updatedAt: "2026-08-08T08:40:00Z",
    collector: {
      id: "51dcf655-dae7-48a6-afc8-67cd5246db33",
      email: "maria.recicla@livora.pe",
    },
    destinationCenter: {
      id: "c0a80101-0000-4000-8000-000000000001",
      email: "acopio.callao@livora.pe",
    },
    requests: [
      {
        id: "f13599b0-c09d-42c7-8eae-749dbdbfe25f",
        status: "COMPLETED",
        itemsEstimated: { HDPE: 70, ALUMINIO: 20 },
        description: "Plástico rígido y latas",
        latitude: -12.0865,
        longitude: -77.0461,
        householdId: "af13637f-a62d-42a1-b4a6-ed98b794456f",
        createdAt: "2026-08-07T07:20:00Z",
      },
    ],
  },
  {
    id: "6fb5d5a1-978e-4eaa-bab7-d47844ced943",
    status: "IN_TRANSIT",
    collectorId: "84a83ae6-71cc-4cde-a964-129f3eec341c",
    destinationCenterId: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
    createdAt: "2026-08-08T07:12:00Z",
    updatedAt: "2026-08-08T09:20:00Z",
    collector: {
      id: "84a83ae6-71cc-4cde-a964-129f3eec341c",
      email: "jose.recicla@livora.pe",
    },
    destinationCenter: {
      id: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
      email: "acopio.surco@livora.pe",
    },
    requests: [
      {
        id: "6cffc27e-f435-493f-ad92-86d29a22607c",
        status: "COMPLETED",
        itemsEstimated: { VIDRIO: 95 },
        description: "Botellas de vidrio",
        latitude: -12.1323,
        longitude: -76.9997,
        householdId: "30b15131-d83f-4bb2-aeb2-d6d328862176",
        createdAt: "2026-08-08T06:00:00Z",
      },
    ],
  },
  {
    id: "00163149-3bb2-4805-88e4-cc45eeeadabe",
    status: "CONSOLIDATED",
    collectorId: "a27b44ad-a4c5-4b86-a743-683bbcfb7c11",
    destinationCenterId: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
    materialsActual: { PET: 210, PAPEL: 84 },
    consolidatedBatchId: "db8bdbd6-d373-45d0-a8b3-18118952909a",
    createdAt: "2026-08-03T08:10:00Z",
    updatedAt: "2026-08-05T18:20:00Z",
    collector: {
      id: "a27b44ad-a4c5-4b86-a743-683bbcfb7c11",
      email: "luis.recicla@livora.pe",
    },
    destinationCenter: {
      id: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
      email: "acopio.surco@livora.pe",
    },
    requests: [],
    trace: {
      ipfsCid: "bafybeid3consolidadolivora7yz9petpaper",
      txHash: "0x4b902fe9849c1dcf36fe81a00279924dd64a41f62b69af46b5aa412771a",
      jobId: "JOB-2798",
      processedAt: "2026-08-04T12:32:00Z",
    },
  },
];

export const consolidated: ConsolidatedBatch[] = [
  {
    id: "db8bdbd6-d373-45d0-a8b3-18118952909a",
    centerId: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
    totalWeight: 294,
    status: "SOLD",
    createdAt: "2026-08-05T18:20:00Z",
    batchIds: [batches[3].id],
  },
];
export const sales: Sale[] = [
  {
    id: "826bfce5-47b7-4d55-a4b9-ff61ddba26aa",
    weightKg: 294,
    totalAmount: 1764,
    buyerId: "a5c16078-610d-4f70-b18a-8fdd8f7bd8ab",
    centerId: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
    createdAt: "2026-08-06T14:20:00Z",
    consolidatedBatchId: consolidated[0].id,
    materialType: "PET + PAPEL",
    center: {
      id: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
      email: "acopio.surco@livora.pe",
    },
  },
  {
    id: "d1aa807a-2064-4bc0-a278-56be9f568a66",
    weightKg: 460,
    totalAmount: 3220,
    buyerId: "a5c16078-610d-4f70-b18a-8fdd8f7bd8ab",
    centerId: "c0a80101-0000-4000-8000-000000000001",
    createdAt: "2026-07-22T12:00:00Z",
    consolidatedBatchId: "374033e3-cd0a-456e-bdbf-b210018c706f",
    materialType: "PET",
    center: {
      id: "c0a80101-0000-4000-8000-000000000001",
      email: "acopio.callao@livora.pe",
    },
  },
  {
    id: "3b1325b9-a4a1-4345-b7d3-24f8333499dd",
    weightKg: 136.5,
    totalAmount: 955.5,
    buyerId: "a5c16078-610d-4f70-b18a-8fdd8f7bd8ab",
    centerId: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
    createdAt: "2026-06-18T16:10:00Z",
    consolidatedBatchId: "6b181a27-217e-4f13-8340-d72e15d15b5d",
    materialType: "ALUMINIO",
    center: {
      id: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
      email: "acopio.surco@livora.pe",
    },
  },
];
export const certificates: Certificate[] = [
  {
    id: "542b1b80-8b05-4cb9-9d39-bda80d74e30d",
    status: "ACTIVE",
    ipfsHash: "ipfs://bafybeig7livoracert294agosto2026",
    esgImpact: {
      co2SavedKg: 735,
      waterSavedLiters: 2940,
      recycledMaterial: "PET + PAPEL",
      recycledKg: 294,
    },
    buyerId: "a5c16078-610d-4f70-b18a-8fdd8f7bd8ab",
    createdAt: "2026-08-07T11:45:00Z",
    saleId: sales[0].id,
    txHash: "0x7296d0ab10ca6528972d4ef680c31d0ec8ef50b6c2f46215f68c83932b1",
  },
  {
    id: "d9f6b493-a041-4fc1-af08-c55f2b74d2e6",
    status: "ACTIVE",
    ipfsHash: "ipfs://bafybeif9livoracert460julio2026",
    esgImpact: {
      co2SavedKg: 1150,
      waterSavedLiters: 4600,
      recycledMaterial: "PET",
      recycledKg: 460,
    },
    buyerId: "a5c16078-610d-4f70-b18a-8fdd8f7bd8ab",
    createdAt: "2026-07-23T09:30:00Z",
    saleId: sales[1].id,
    txHash: "0x3e81599d84c9ebeeae9f0a6ce9a4dd13c6abfd8858a1d23e930ba55816a",
  },
  {
    id: "acbf7655-b8d9-4fc3-a318-0851977566cc",
    status: "ACTIVE",
    ipfsHash: "ipfs://bafybeih2livoracert136junio2026",
    esgImpact: {
      co2SavedKg: 341.25,
      waterSavedLiters: 1365,
      recycledMaterial: "ALUMINIO",
      recycledKg: 136.5,
    },
    buyerId: "a5c16078-610d-4f70-b18a-8fdd8f7bd8ab",
    createdAt: "2026-06-19T10:15:00Z",
    saleId: sales[2].id,
    txHash: "0x992ce64aba7b6a6e31ba52b387a1804743228e1fe38e2f3c033d9f45e29",
  },
];
export const inventory: InventoryItem[] = [
  {
    id: "inv-1",
    materialType: "PET",
    quantityKg: 1840,
    centerId: "c0a80101-0000-4000-8000-000000000001",
    updatedAt: "2026-08-08T09:10:00Z",
    center: {
      id: "c0a80101-0000-4000-8000-000000000001",
      email: "Acopio Callao",
    },
  },
  {
    id: "inv-2",
    materialType: "HDPE",
    quantityKg: 690,
    centerId: "c0a80101-0000-4000-8000-000000000001",
    updatedAt: "2026-08-08T08:52:00Z",
    center: {
      id: "c0a80101-0000-4000-8000-000000000001",
      email: "Acopio Callao",
    },
  },
  {
    id: "inv-3",
    materialType: "ALUMINIO",
    quantityKg: 214,
    centerId: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
    updatedAt: "2026-08-07T17:44:00Z",
    center: {
      id: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
      email: "Acopio Surco",
    },
  },
  {
    id: "inv-4",
    materialType: "CARTÓN",
    quantityKg: 82,
    centerId: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
    updatedAt: "2026-08-07T16:10:00Z",
    center: {
      id: "5eeaa3eb-ef24-4cd4-b953-cf187440807d",
      email: "Acopio Surco",
    },
  },
];
export const kycApplications: KycApplication[] = [
  {
    id: "kyc-1",
    status: "PENDING",
    documentUrl: "#",
    userId: "51dcf655-dae7-48a6-afc8-67cd5246db33",
    createdAt: "2026-08-08T07:30:00Z",
    user: {
      id: "51dcf655-dae7-48a6-afc8-67cd5246db33",
      email: "maria.recicla@livora.pe",
      role: "RECOLECTOR",
    },
  },
  {
    id: "kyc-2",
    status: "PENDING",
    documentUrl: "#",
    userId: "84a83ae6-71cc-4cde-a964-129f3eec341c",
    createdAt: "2026-08-07T15:45:00Z",
    user: {
      id: "84a83ae6-71cc-4cde-a964-129f3eec341c",
      email: "jose.recicla@livora.pe",
      role: "RECOLECTOR",
    },
  },
  {
    id: "kyc-3",
    status: "APPROVED",
    documentUrl: "#",
    userId: "a27b44ad-a4c5-4b86-a743-683bbcfb7c11",
    createdAt: "2026-08-04T10:20:00Z",
    user: {
      id: "a27b44ad-a4c5-4b86-a743-683bbcfb7c11",
      email: "luis.recicla@livora.pe",
      role: "RECOLECTOR",
    },
  },
];
export const monthlyImpact = [
  { month: "Mar", kg: 310 },
  { month: "Abr", kg: 430 },
  { month: "May", kg: 390 },
  { month: "Jun", kg: 540 },
  { month: "Jul", kg: 720 },
  { month: "Ago", kg: 890 },
];

export const shortId = (id: string) => `${id.slice(0, 6)}…${id.slice(-4)}`;
export const kg = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(value) +
  " kg";
export const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    value,
  );
export const date = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
