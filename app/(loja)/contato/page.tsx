import Link from "next/link";
import { LegalPage, StoreIdentity } from "@/components/legal/legal-page";
import { getStoreInfo } from "@/lib/store-info";

export const metadata = {
  title: "Fale com a gente",
  description: "Canais de atendimento e ajuda da Busca Agora.",
};
export default async function ContactPage() {
  const info = await getStoreInfo();
  return (
    <LegalPage titulo="Fale com a gente" atualizadoEm="08/10/2026">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[22px] border border-borda p-5">
          <h2>WhatsApp</h2>
          {info.whatsapp ? (
            <a
              className="mt-4 inline-flex min-h-12 items-center rounded-[14px] bg-lima px-5 font-display !text-noite !no-underline"
              href={`https://wa.me/${info.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site da Busca Agora.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chamar no WhatsApp
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : (
            <p>[a preencher]</p>
          )}
        </section>
        <section className="rounded-[22px] border border-borda p-5">
          <h2>E-mail</h2>
          <p className="break-words">
            {info.email ? (
              <a href={`mailto:${info.email}`}>{info.email}</a>
            ) : (
              "[a preencher]"
            )}
          </p>
        </section>
        <section className="rounded-[22px] border border-borda p-5">
          <h2>Horário de atendimento</h2>
          <p>{info.horario ?? "[a preencher]"}</p>
        </section>
        <section className="rounded-[22px] border border-borda p-5">
          <h2>Atalhos</h2>
          <ul>
            <li>
              <Link href="/rastreio">Rastrear pedido</Link>
            </li>
            <li>
              <Link href="/conta/pedidos">Meus pedidos</Link>
            </li>
            <li>
              <Link href="/trocas">Trocas e devoluções</Link>
            </li>
          </ul>
        </section>
      </div>
      <h2>Dados da loja</h2>
      <StoreIdentity info={info} />
    </LegalPage>
  );
}
