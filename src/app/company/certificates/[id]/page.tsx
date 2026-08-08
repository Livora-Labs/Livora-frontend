import { notFound } from "next/navigation";
import { CertificateDetail } from "@/components/CertificateDetail";
import { certificates } from "@/lib/data";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = certificates.find((x) => x.id === id);
  if (!c) notFound();
  return <CertificateDetail certificate={c} />;
}
