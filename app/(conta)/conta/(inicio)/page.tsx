import type { Metadata } from "next";

import { AuthForm } from "@/components/conta/auth-form";
import { DeleteAccountDialog } from "@/components/conta/delete-account-dialog";
import { Field } from "@/components/conta/field";
import { deleteAccount, updateProfile } from "@/lib/account/actions";
import { requireUser } from "@/lib/auth/session";
import { formatCpf } from "@/lib/br/cpf";
import { formatTelefone } from "@/lib/br/telefone";
import { createClient } from "@/lib/db/server";

export const metadata: Metadata = {
  title: "Meus dados",
  robots: { index: false, follow: false },
};

const card =
  "flex flex-col gap-5 rounded-[22px] border border-borda bg-white p-5 md:rounded-[28px] md:p-8";

export default async function ContaPage(props: PageProps<"/conta">) {
  const user = await requireUser("/conta");
  const senhaOk = (await props.searchParams).senha === "ok";
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, cpf, telefone")
    .eq("id", user.id)
    .single();

  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
        Meus dados
      </h1>
      {senhaOk ? (
        <p
          role="status"
          className="m-0 rounded-[14px] bg-[#ECFDF3] px-4 py-3 text-[15px] text-estoque"
        >
          Senha alterada.
        </p>
      ) : null}

      <section aria-labelledby="dados" className={card}>
        <h2 id="dados" className="m-0 font-display text-xl font-bold">
          Dados pessoais
        </h2>
        <p className="m-0 text-[15px] text-texto-2">
          E-mail: <b className="text-noite">{user.email}</b>
        </p>
        <AuthForm action={updateProfile} submitLabel="Salvar dados">
          <Field
            id="nome"
            name="nome"
            label="Nome completo"
            autoComplete="name"
            defaultValue={profile?.nome ?? ""}
            required
            maxLength={120}
          />
          <Field
            id="cpf"
            name="cpf"
            label="CPF"
            inputMode="numeric"
            placeholder="000.000.000-00"
            defaultValue={profile?.cpf ? formatCpf(profile.cpf) : ""}
            hint="Necessário para a nota fiscal. Pode preencher na hora da compra."
            maxLength={14}
          />
          <Field
            id="telefone"
            name="telefone"
            label="Celular"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(11) 98888-7777"
            defaultValue={
              profile?.telefone ? formatTelefone(profile.telefone) : ""
            }
            maxLength={15}
          />
        </AuthForm>
      </section>

      <section aria-labelledby="excluir" className={card}>
        <h2 id="excluir" className="m-0 font-display text-xl font-bold">
          Excluir conta
        </h2>
        <p className="m-0 text-[15px] text-texto-2">
          Apaga seus dados pessoais, endereços e carrinho. Pedidos já feitos
          ficam guardados só com os dados exigidos pela nota fiscal.
        </p>
        <div>
          <DeleteAccountDialog action={deleteAccount} />
        </div>
      </section>
    </>
  );
}
