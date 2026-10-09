import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AuthForm } from "@/components/conta/auth-form";
import { Field } from "@/components/conta/field";
import { demoteAdmin, promoteAdmin } from "@/lib/admin/actions";
import { listTeam } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "Equipe" };

const card =
  "flex flex-col gap-4 rounded-[22px] border border-borda bg-white p-5 md:p-8";

export default async function AdminEquipe() {
  const [eu, equipe] = await Promise.all([requireAdmin(), listTeam()]);

  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        Equipe
      </h1>
      <p className="m-0 max-w-[640px] text-[15px] text-texto-2">
        Quem é admin entra pela tela de login normal da loja e vê o painel:
        pedidos, produtos, vendas e configurações. Dê acesso só a quem cuida da
        loja.
      </p>

      <section className={card} aria-labelledby="admins">
        <h2 id="admins" className="m-0 font-display text-xl font-bold">
          Quem tem acesso ao painel
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {equipe.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-borda p-4"
            >
              <span className="flex min-w-0 flex-col">
                <b className="text-noite">
                  {p.nome}
                  {p.id === eu.id ? (
                    <span className="ml-2 rounded-full bg-ultramar-50 px-2 py-0.5 text-xs text-ultramar">
                      você
                    </span>
                  ) : null}
                </b>
                <span className="text-sm break-all text-texto-2">
                  {p.email}
                </span>
              </span>
              {p.id !== eu.id ? (
                <ConfirmDialog
                  gatilho="Tirar acesso"
                  titulo={`Tirar o acesso de ${p.nome}?`}
                  texto="A pessoa continua com a conta de cliente, mas não vê mais o painel."
                  confirmarLabel="Tirar acesso"
                  perigo
                  action={demoteAdmin}
                  campos={{ id: p.id }}
                />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className={card} aria-labelledby="novo">
        <h2 id="novo" className="m-0 font-display text-xl font-bold">
          Dar acesso a alguém
        </h2>
        <p className="m-0 text-[15px] text-texto-2">
          A pessoa precisa ter uma conta na loja: peça para ela se cadastrar em{" "}
          <b>busca-agora.vercel.app/cadastro</b> e depois coloque o e-mail dela
          aqui.
        </p>
        <AuthForm action={promoteAdmin} submitLabel="Tornar admin">
          <Field
            id="email"
            name="email"
            label="E-mail da conta"
            type="email"
            inputMode="email"
            autoComplete="off"
          />
        </AuthForm>
      </section>
    </>
  );
}
