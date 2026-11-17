import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { adminNav } from "@/lib/adminNav";
export default async function Placeholder({ params }: { params: { module: string } }) {
  const item = adminNav.find((n) => n.href === `/admin/${params.module}`);
  if (!item) notFound();
  await requireRole(item.min);
  return (<><h1>{item.label}</h1><div className="a-card"><p>This module isn’t built yet. It’s planned for the next admin phase.</p></div></>);
}
