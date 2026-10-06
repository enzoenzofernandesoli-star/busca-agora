import type { ReactNode } from "react";
import { formatCep } from "@/lib/br/cep";

export type Address = {
  id: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  principal: boolean;
};

export function AddressCard({
  address,
  actions,
}: {
  address: Address;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-borda bg-white p-5 font-sans md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-2 text-base text-noite">
        {address.principal && (
          <span className="inline-flex rounded-full bg-lima px-3 py-1 text-xs font-bold text-noite">
            Principal
          </span>
        )}
        <p className="font-bold break-words">
          {address.rua}, {address.numero}
          {address.complemento ? ` - ${address.complemento}` : ""}
        </p>
        <p className="text-texto-2">
          {address.bairro} · {address.cidade}/{address.uf}
        </p>
        <p className="text-texto-2">CEP {formatCep(address.cep)}</p>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
