import * as React from "react";
import { Column, Row, Section, Text } from "@react-email/components";
import type { OrderEmailBase } from "@/emails/types";
import { formatBRL } from "@/lib/format";

export function OrderItems({
  itens,
  subtotalCents,
  freteCents,
  descontoCents,
  totalCents,
  freteServico,
}: Pick<
  OrderEmailBase,
  | "itens"
  | "subtotalCents"
  | "freteCents"
  | "descontoCents"
  | "totalCents"
  | "freteServico"
>) {
  const valueStyle: React.CSSProperties = {
    textAlign: "right",
    fontFamily: "Sora, Arial, Helvetica, sans-serif",
    fontWeight: 700,
  };
  return (
    <Section style={{ margin: "24px 0" }}>
      {itens.map((item, index) => (
        <Row key={index} style={{ borderBottom: "1px solid #E3E5F2" }}>
          <Column
            style={{ width: "70%", padding: "8px 0", verticalAlign: "top" }}
          >
            <Text style={{ margin: 0, fontWeight: 700 }}>{item.nome}</Text>
            {item.variacao && (
              <Text style={{ margin: 0, color: "#4A4F70" }}>
                {item.variacao}
              </Text>
            )}
            <Text style={{ margin: 0, color: "#4A4F70" }}>
              Qtd. {item.quantidade}
            </Text>
          </Column>
          <Column
            style={{ ...valueStyle, padding: "8px 0", verticalAlign: "top" }}
          >
            {formatBRL(item.precoCents * item.quantidade)}
          </Column>
        </Row>
      ))}
      {[
        ["Subtotal", formatBRL(subtotalCents)],
        [
          `Frete${freteServico ? ` (${freteServico})` : ""}`,
          freteCents === 0 ? "Grátis" : formatBRL(freteCents),
        ],
        ...(descontoCents > 0
          ? [["Desconto", `− ${formatBRL(descontoCents)}`]]
          : []),
      ].map(([label, value]) => (
        <Row key={label} style={{ marginTop: 8 }}>
          <Column style={{ padding: "4px 0" }}>{label}</Column>
          <Column style={valueStyle}>{value}</Column>
        </Row>
      ))}
      <Row style={{ marginTop: 16, borderTop: "1px solid #E3E5F2" }}>
        <Column style={{ paddingTop: 12, fontWeight: 700 }}>Total</Column>
        <Column
          style={{
            ...valueStyle,
            fontSize: 22,
            fontWeight: 800,
            paddingTop: 12,
          }}
        >
          {formatBRL(totalCents)}
        </Column>
      </Row>
    </Section>
  );
}
