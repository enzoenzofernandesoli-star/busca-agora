import * as React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import Recebido, { PreviewProps as received } from "@/emails/pedido-recebido";
import Aprovado, { PreviewProps as paid } from "@/emails/pagamento-aprovado";
import Nota, { PreviewProps as invoice } from "@/emails/nota-emitida";
import Enviado, { PreviewProps as shipped } from "@/emails/pedido-enviado";
import Entregue, { PreviewProps as delivered } from "@/emails/pedido-entregue";
import { formatBRL } from "@/lib/format";
describe("order emails", () => {
  it.each([
    ["received", <Recebido key="received" {...received} />],
    ["paid", <Aprovado key="paid" {...paid} />],
    ["invoice", <Nota key="invoice" {...invoice} />],
    ["shipped", <Enviado key="shipped" {...shipped} />],
    ["delivered", <Entregue key="delivered" {...delivered} />],
  ])("renders %s", async (_, element) => {
    const html = await render(element as React.ReactElement);
    expect(html).toContain(received.numero);
    expect(html.replace(/&nbsp;|&#160;|\u00a0/g, " ")).toContain(
      formatBRL(received.totalCents).replace(/\u00a0/g, " "),
    );
    expect(html).toContain(
      `${received.siteUrl}/conta/pedidos/${received.numero}`,
    );
    expect(html).toMatch(
      /<img\b(?=[^>]*logo-email\.png)(?=[^>]*alt="Busca Agora")[^>]*>/,
    );
    expect(html).not.toMatch(/undefined|NaN/);
  });
  it.each([
    ["pix", "Pague o Pix em até 30 minutos"],
    ["boleto", "Pague o boleto em até 3 dias úteis"],
    ["card", "Estamos confirmando o pagamento com o cartão"],
  ] as const)("renders payment instructions for %s", async (metodo, text) => {
    expect(await render(<Recebido {...received} metodo={metodo} />)).toContain(
      text,
    );
  });
  it("omits carrier CTA when the tracking URL is absent", async () => {
    expect(
      await render(<Enviado {...shipped} rastreioUrl={null} />),
    ).not.toContain("Rastrear entrega");
  });
  it("shows free shipping", async () => {
    expect(await render(<Recebido {...received} freteCents={0} />)).toContain(
      "Grátis",
    );
  });
  it("links invoice PDF and tracking URL with order fallback links", async () => {
    expect(
      await render(
        <Nota {...invoice} danfeUrl="https://example.test/nota.pdf" />,
      ),
    ).toContain('href="https://example.test/nota.pdf"');
    expect(
      await render(
        <Enviado {...shipped} rastreioUrl="https://example.test/rastreio" />,
      ),
    ).toContain('href="https://example.test/rastreio"');
  });
});
