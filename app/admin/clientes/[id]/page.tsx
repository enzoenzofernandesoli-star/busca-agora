import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/admin/status-badge";
import { canaisTexto } from "@/lib/admin/customer-format";
import { getCustomer } from "@/lib/admin/queries";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Cliente" };

const data = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const card =
  "flex flex-col gap-3 rounded-[22px] border border-borda bg-white p-5 md:p-6";

// Read only. CPF masked; marketing consent with its dates (LGPD).
export default async function AdminCliente(
  props: PageProps<"/admin/clientes/[id]">,
) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const c = await getCustomer(id);
  if (!c) notFound();

  return (
    <>
      <Link href="/admin/clientes" className="text-[15px] font-bold">
        ← Clientes
      </Link>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        {c.nome}
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        <section className={card} aria-labelledby="dados">
          <h2 id="dados" className="m-0 font-display text-xl font-bold">
            Dados
          </h2>
          <p className="m-0">E-mail: {c.email || "—"}</p>
          <p className="m-0">CPF: {c.cpf || "—"}</p>
          <p className="m-0">Celular: {c.telefone || "—"}</p>
          <p className="m-0 text-texto-2">
            Cliente desde {data.format(new Date(c.criadoEm))}
          </p>
        </section>
        <section className={card} aria-labelledby="ofertas">
          <h2 id="ofertas" className="m-0 font-display text-xl font-bold">
            Ofertas e novidades
          </h2>
          {c.marketing ? (
            <p className="m-0">
              <b>Aceita</b> por {canaisTexto(c.canais)}
              {c.marketingDesde
                ? `, desde ${data.format(new Date(c.marketingDesde))}`
                : ""}
              .
            </p>
          ) : (
            <p className="m-0">
              <b>Não aceita.</b>
              {c.marketingDesligadoEm
                ? ` Desligou em ${data.format(new Date(c.marketingDesligadoEm))}.`
                : ""}
            </p>
          )}
          <p className="m-0 text-sm text-texto-2">
            Só envie ofertas para quem aceitou, e só pelos canais escolhidos.
          </p>
        </section>
      </div>
      <section className={card} aria-labelledby="pedidos">
        <h2 id="pedidos" className="m-0 font-display text-xl font-bold">
          Pedidos
        </h2>
        {c.pedidos.length === 0 ? (
          <p className="m-0 text-texto-2">Nenhum pedido ainda.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {c.pedidos.map((p) => (
              <li key={p.numero} className="flex flex-wrap items-center gap-3">
                <Link href={`/admin/pedidos/${p.numero}`} className="font-bold">
                  {p.numero}
                </Link>
                <StatusBadge status={p.status} />
                <span>{formatBRL(p.total_cents)}</span>
                <span className="text-texto-2">
                  {data.format(new Date(p.created_at))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
