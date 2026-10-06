import type { Metadata } from "next";

import { AddressCard } from "@/components/conta/address-card";
import { AddressManager } from "@/components/conta/address-manager";
import { EmptyState } from "@/components/loja/empty-state";
import {
  deleteAddress,
  saveAddress,
  setMainAddress,
} from "@/lib/account/actions";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";

export const metadata: Metadata = {
  title: "Endereços",
  robots: { index: false, follow: false },
};

const smallButton =
  "min-h-11 cursor-pointer px-2 text-[15px] font-bold hover:text-noite";

export default async function EnderecosPage() {
  const user = await requireUser("/conta/enderecos");
  const supabase = await createClient();
  const { data: enderecos } = await supabase
    .from("addresses")
    .select("id, cep, rua, numero, complemento, bairro, cidade, uf, principal")
    .eq("user_id", user.id)
    .order("principal", { ascending: false })
    .order("created_at");

  const lista = enderecos ?? [];

  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
        Endereços
      </h1>

      {lista.length === 0 ? (
        <EmptyState
          icone="caixa"
          titulo="Nenhum endereço ainda"
          texto="Cadastre onde você quer receber seus pedidos. O CEP preenche o resto."
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {lista.map((endereco) => (
            <li key={endereco.id} className="flex flex-col gap-3">
              <AddressCard
                address={endereco}
                actions={
                  <div className="flex flex-wrap items-center gap-1">
                    <AddressManager
                      action={saveAddress}
                      address={endereco}
                      label="Editar"
                      variant="link"
                    />
                    {!endereco.principal ? (
                      <form action={setMainAddress}>
                        <input type="hidden" name="id" value={endereco.id} />
                        <button
                          type="submit"
                          className={`${smallButton} text-ultramar`}
                        >
                          Tornar principal
                        </button>
                      </form>
                    ) : null}
                    <form action={deleteAddress}>
                      <input type="hidden" name="id" value={endereco.id} />
                      <button
                        type="submit"
                        className={`${smallButton} text-rosa-ink`}
                        aria-label={`Excluir endereço ${endereco.rua}, ${endereco.numero}`}
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <AddressManager action={saveAddress} label="Adicionar endereço" />
    </>
  );
}
