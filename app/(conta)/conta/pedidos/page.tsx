import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/loja/empty-state";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { formatBRL } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pedidos",
  robots: { index: false, follow: false },
};

const dataBR = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function PedidosPage() {
  const user = await requireUser("/conta/pedidos");
  const supabase = await createClient();
  const { data: pedidos } = await supabase
    .from("orders")
    .select("id, numero, status, total_cents, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
        Pedidos
      </h1>
      {!pedidos || pedidos.length === 0 ? (
        <EmptyState
          icone="caixa"
          titulo="Você ainda não fez pedidos"
          texto="Quando comprar, seus pedidos aparecem aqui com o status de cada um."
          acao={{ label: "Ver produtos", href: "/busca" }}
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {pedidos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/conta/pedidos/${p.numero}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-borda bg-white p-5 text-noite no-underline hover:border-ultramar"
              >
                <span className="flex flex-col gap-1">
                  <b className="font-display">{p.numero}</b>
                  <span className="text-sm text-texto-2">
                    {dataBR.format(new Date(p.created_at))}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  <span className="font-display font-bold">
                    {formatBRL(p.total_cents)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
