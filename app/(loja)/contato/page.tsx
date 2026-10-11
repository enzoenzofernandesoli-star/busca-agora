import type { SVGProps } from "react";
import Link from "next/link";
import { StoreIdentity } from "@/components/legal/legal-page";
import { ArrowRightIcon } from "@/components/loja/icons";
import { getStoreInfo } from "@/lib/store-info";

export const metadata = {
  title: "Fale com a gente",
  description: "Canais de atendimento e ajuda da Busca Agora.",
};

function ContactIcon({
  kind = "chat",
  ...props
}: SVGProps<SVGSVGElement> & { kind?: "chat" | "mail" | "clock" | "links" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {kind === "chat" ? (
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
      ) : kind === "mail" ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </>
      ) : kind === "clock" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      ) : (
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      )}
    </svg>
  );
}

export default async function ContactPage() {
  const info = await getStoreInfo();
  const cardClassName =
    "flex min-w-0 flex-col items-start gap-4 rounded-[22px] border border-borda bg-white p-6";

  return (
    <article className="mx-auto flex w-full max-w-[960px] flex-col gap-6 text-noite">
      <header className="flex flex-col items-start gap-4">
        <span className="flex size-12 items-center justify-center rounded-[14px] bg-ultramar-50 text-ultramar">
          <ContactIcon />
        </span>
        <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.02em] md:text-[34px]">
          Fale com a Busca Agora
        </h1>
        <p className="text-[16px] leading-relaxed text-texto-2">
          Dúvida sobre produto, entrega ou pedido? Escolha um canal.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={cardClassName} aria-labelledby="contact-whatsapp">
          <span className="flex size-11 items-center justify-center rounded-[14px] bg-lima text-noite">
            <ContactIcon />
          </span>
          <h2
            id="contact-whatsapp"
            className="font-display text-[18px] font-bold"
          >
            WhatsApp
          </h2>
          {info.whatsapp ? (
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-ultramar px-5 py-3 text-center font-display text-[16px] font-bold text-white hover:bg-ultramar-700"
              href={`https://wa.me/${info.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site da Busca Agora.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chamar no WhatsApp
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : (
            <p className="text-[16px] leading-relaxed text-texto-2">
              Em breve por aqui.
            </p>
          )}
        </section>

        <section className={cardClassName} aria-labelledby="contact-email">
          <span className="flex size-11 items-center justify-center rounded-[14px] bg-ciano-tile text-ciano-ink">
            <ContactIcon kind="mail" />
          </span>
          <h2 id="contact-email" className="font-display text-[18px] font-bold">
            E-mail
          </h2>
          {info.email ? (
            <a
              className="inline-flex min-h-11 max-w-full items-center text-[16px] break-all text-ultramar underline underline-offset-4"
              href={`mailto:${info.email}`}
            >
              {info.email}
            </a>
          ) : (
            <p className="text-[16px] leading-relaxed text-texto-2">Em breve</p>
          )}
        </section>

        <section className={cardClassName} aria-labelledby="contact-hours">
          <span className="flex size-11 items-center justify-center rounded-[14px] bg-rosa-tile text-rosa-ink">
            <ContactIcon kind="clock" />
          </span>
          <h2 id="contact-hours" className="font-display text-[18px] font-bold">
            Horário
          </h2>
          <p className="text-[16px] leading-relaxed text-texto-2">
            {info.horario ?? "Em breve"}
          </p>
        </section>

        <section className={cardClassName} aria-labelledby="contact-shortcuts">
          <span className="flex size-11 items-center justify-center rounded-[14px] bg-ultramar-50 text-ultramar">
            <ContactIcon kind="links" />
          </span>
          <h2
            id="contact-shortcuts"
            className="font-display text-[18px] font-bold"
          >
            Atalhos
          </h2>
          <ul className="w-full text-[16px] font-bold text-ultramar">
            {[
              { href: "/rastreio", label: "Rastrear pedido" },
              { href: "/conta/pedidos", label: "Meus pedidos" },
              { href: "/trocas", label: "Trocas e devoluções" },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg hover:underline focus-visible:underline"
                  href={href}
                >
                  {label}
                  <ArrowRightIcon size={18} className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="store-details">
        <h2 id="store-details" className="font-display text-[20px] font-bold">
          Dados da loja
        </h2>
        <div className="min-w-0 rounded-[22px] border border-borda bg-white p-5 text-[15px] leading-[1.6] md:p-8 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:max-w-full [&_a]:items-center [&_a]:break-all [&_a]:text-ultramar [&_a]:underline [&_li]:mb-1.5">
          <StoreIdentity info={info} />
        </div>
      </section>
    </article>
  );
}
