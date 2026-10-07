import type { ReactNode } from "react";

import type { StoreInfo } from "@/lib/store-info";

export const A_PREENCHER = "[a preencher]";

/** "5511999998888" -> "+55 11 99999-8888". */
export function formatWhatsapp(d: string): string {
  const m = /^(\d{2})(\d{2})(\d{4,5})(\d{4})$/.exec(d);
  return m ? `+${m[1]} ${m[2]} ${m[3]}-${m[4]}` : d;
}

/** Reading page for the legal texts: plain h2/p/ul/li/a/strong children. */
export function LegalPage({
  titulo,
  atualizadoEm,
  children,
  aviso,
}: {
  titulo: string;
  atualizadoEm: string;
  children: ReactNode;
  aviso?: boolean;
}) {
  return (
    <article className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
          {titulo}
        </h1>
        <p className="m-0 text-[15px] text-texto-2">
          Atualizado em {atualizadoEm}
        </p>
      </header>
      {aviso ? (
        <p className="m-0 flex items-start gap-3 rounded-[22px] bg-rosa-tile p-5 text-[15px] text-rosa-ink">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          Versão inicial, em revisão. Pode mudar antes da abertura da loja.
        </p>
      ) : null}
      <div className="rounded-[22px] border border-borda bg-white p-5 text-noite md:rounded-[28px] md:p-9 [&_a]:font-bold [&_a]:text-ultramar [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2:first-child]:mt-0 [&_li]:mb-1.5 [&_p]:my-3 [&_p]:text-[16px] [&_p]:leading-relaxed [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[16px] [&_ul]:leading-relaxed">
        {children}
      </div>
    </article>
  );
}

/** Seller identity block (name, CPF/CNPJ, address, contact). */
export function StoreIdentity({ info }: { info: StoreInfo }) {
  const v = (x: string | null) => x ?? A_PREENCHER;
  return (
    <ul className="!list-none !pl-0">
      <li>
        <strong>Loja:</strong> {info.marca}
      </li>
      <li>
        <strong>Vendedor:</strong> {v(info.vendedor)}
      </li>
      <li>
        <strong>CPF/CNPJ:</strong> {v(info.documento)}
      </li>
      <li>
        <strong>Endereço:</strong> {v(info.endereco)}
      </li>
      <li>
        <strong>E-mail:</strong>{" "}
        {info.email ? (
          <a href={`mailto:${info.email}`}>{info.email}</a>
        ) : (
          A_PREENCHER
        )}
      </li>
      <li>
        <strong>WhatsApp:</strong>{" "}
        {info.whatsapp ? (
          <a
            href={`https://wa.me/${info.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {formatWhatsapp(info.whatsapp)}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        ) : (
          A_PREENCHER
        )}
      </li>
    </ul>
  );
}
