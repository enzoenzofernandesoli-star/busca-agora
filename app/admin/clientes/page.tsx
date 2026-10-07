import { DataTable } from "@/components/admin/data-table";
import { listCustomers } from "@/lib/admin/queries";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Clientes" };

const data = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

// Read only (CLAUDE.md section 7). CPF is masked.
export default async function AdminClientes() {
  const clientes = await listCustomers();
  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        Clientes
      </h1>
      <DataTable
        linhas={clientes}
        chave={(c) => c.id}
        vazio="Nenhum cliente cadastrado ainda."
        colunas={[
          {
            titulo: "Nome",
            render: (c) => (
              <span className="font-bold">
                {c.nome}
                {c.admin ? (
                  <span className="ml-2 rounded-full bg-lima px-2 py-0.5 text-xs text-noite">
                    admin
                  </span>
                ) : null}
              </span>
            ),
          },
          { titulo: "E-mail", render: (c) => c.email },
          { titulo: "CPF", render: (c) => c.cpf || "—" },
          { titulo: "Pedidos", render: (c) => String(c.pedidos) },
          { titulo: "Total comprado", render: (c) => formatBRL(c.totalCents) },
          { titulo: "Desde", render: (c) => data.format(new Date(c.criadoEm)) },
        ]}
      />
    </>
  );
}
