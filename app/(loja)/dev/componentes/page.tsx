import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryChip } from "@/components/loja/category-chip";
import { Price } from "@/components/loja/price";
import { ProductCard } from "@/components/loja/product-card";
import { SectionHeader } from "@/components/loja/section-header";
import { Button } from "@/components/ui/button";
import { navCategories } from "@/lib/site";

export const metadata: Metadata = {
  title: "Componentes",
  robots: { index: false, follow: false },
};

// Visual check of the base components against docs/design. Never in production.
export default function ComponentesPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <>
      <section
        aria-labelledby="botoes"
        className="flex flex-col gap-4 md:gap-5"
      >
        <SectionHeader id="botoes" eyebrow="Componentes" title="Botões" />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="principal">Principal</Button>
          <Button variant="lima">Lima</Button>
          <Button variant="contorno">Contorno</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="principal" size="lg">
            Comprar agora
          </Button>
          <Button variant="contorno" size="lg">
            Adicionar ao carrinho
          </Button>
          <Button variant="principal" disabled>
            Desabilitado
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="precos"
        className="flex flex-col gap-4 md:gap-5"
      >
        <SectionHeader id="precos" title="Preços (centavos)" />
        <div className="flex flex-wrap items-baseline gap-6">
          <Price cents={8990} size="sm" />
          <Price cents={12990} size="md" />
          <Price cents={14990} size="lg" />
          <Price cents={8990} size="xl" />
        </div>
      </section>

      <section aria-labelledby="chips" className="flex flex-col gap-4 md:gap-5">
        <SectionHeader id="chips" title="Categorias" />
        <div className="flex flex-wrap gap-2">
          {navCategories.map((c) => (
            <CategoryChip
              key={c.href}
              href={c.href}
              label={c.label}
              cor={c.cor}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="mais-buscados"
        className="flex flex-col gap-3.5 md:gap-5"
      >
        <SectionHeader
          id="mais-buscados"
          eyebrow="O que todo mundo está buscando"
          title="Mais buscados"
          link={{ href: "/busca?filtro=mais-buscados", label: "Ver todos" }}
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] md:gap-5">
          <ProductCard
            href="/p/exemplo-fone"
            nome="Fone Bluetooth com microfone e cancelamento de ruído"
            categoria="eletronicos"
            precoCents={8990}
            mostrarCategoria
          />
          <ProductCard
            href="/p/exemplo-smartwatch"
            nome="Smartwatch com monitor de batimentos"
            categoria="eletronicos"
            precoCents={12990}
            mostrarCategoria
          />
          <ProductCard
            href="/p/exemplo-serum"
            nome="Sérum facial com vitamina C 30 ml"
            categoria="cosmeticos"
            precoCents={4990}
            mostrarCategoria
          />
          <ProductCard
            href="/p/exemplo-caixa"
            nome="Caixa de som portátil à prova d’água"
            categoria="eletronicos"
            precoCents={14990}
            mostrarCategoria
          />
        </div>
      </section>

      <section
        aria-labelledby="cosmeticos"
        className="flex flex-col gap-3.5 md:gap-5"
      >
        <SectionHeader
          id="cosmeticos"
          eyebrow="Cosméticos"
          eyebrowColor="text-rosa-ink"
          eyebrowSquare="bg-rosa"
          title="Sua rotina de cuidados"
          link={{ href: "/c/cosmeticos", label: "Ver cosméticos" }}
        />
      </section>
    </>
  );
}
