import Link from "next/link";
import { LegalPage, StoreIdentity } from "@/components/legal/legal-page";
import { getStoreInfo } from "@/lib/store-info";

export const metadata = {
  title: "Sobre a Busca Agora",
  description: "Uma loja de família, com eletrônicos e cosméticos para você.",
};
export default async function AboutPage() {
  const info = await getStoreInfo();
  return (
    <LegalPage titulo="Sobre a Busca Agora" atualizadoEm="08/10/2026">
      <p>
        Somos uma loja online de eletrônicos e cosméticos. Aqui, você compra de
        um único vendedor: a Busca Agora.
      </p>
      <p>
        Somos um negócio de família. Cuidamos da escolha dos produtos, do
        atendimento e do envio para sua casa.
      </p>
      <div className="my-6 rounded-[22px] bg-noite p-6 font-display text-2xl font-extrabold text-white">
        Buscou? <span className="text-lima">Tá aqui.</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Pix aprovado na hora",
          "Frete calculado no seu CEP",
          "Troca em até 7 dias",
        ].map((label, index) => (
          <div key={label} className="rounded-[22px] border border-borda p-4">
            <svg
              aria-hidden="true"
              className="mb-3 size-8 text-ultramar"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {index === 0 ? (
                <>
                  <path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z" />
                </>
              ) : index === 1 ? (
                <>
                  <path d="M3 6h12v12H3V6Zm12 4h4l3 4v4h-7" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="18" cy="18" r="2" />
                </>
              ) : (
                <>
                  <path d="M3 10a9 9 0 1 1 2 9M3 4v6h6" />
                  <path d="M12 7v5l3 2" />
                </>
              )}
            </svg>
            <strong className="font-display text-sm">
              {index === 2 ? <Link href="/trocas">{label}</Link> : label}
            </strong>
          </div>
        ))}
      </div>
      <h2>Quem está por trás da loja</h2>
      <StoreIdentity info={info} />
    </LegalPage>
  );
}
