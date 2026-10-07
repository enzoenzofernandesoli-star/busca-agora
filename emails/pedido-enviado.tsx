import * as React from "react";
import { Button, Heading, Link, Section, Text } from "@react-email/components";
import {
  EMAIL_BUTTON_STYLE,
  EMAIL_TITLE_STYLE,
  EmailAddressBlock,
  EmailLayout,
  OrderGreeting,
} from "@/emails/components/email-layout";
import { OrderItems } from "@/emails/components/order-items";
import { EXAMPLE_ORDER } from "@/emails/types";
import type { PedidoEnviadoProps } from "@/emails/types";
export const PreviewProps: PedidoEnviadoProps = {
  ...EXAMPLE_ORDER,
  transportadora: "Transportadora Exemplo",
  rastreio: "CODIGO-EXEMPLO-123",
  rastreioUrl: null,
};
export default function PedidoEnviado(props: PedidoEnviadoProps) {
  const orderUrl = `${props.siteUrl}/conta/pedidos/${props.numero}`;
  return (
    <EmailLayout
      siteUrl={props.siteUrl}
      preview="Seu pedido está a caminho. Confira o rastreio."
    >
      <Heading style={EMAIL_TITLE_STYLE}>Seu pedido saiu para entrega</Heading>
      <OrderGreeting nome={props.clienteNome} numero={props.numero} />
      <Section
        style={{
          backgroundColor: "#E6F8FF",
          color: "#08708F",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <Text style={{ margin: 0 }}>
          {props.transportadora || "Transportadora"}
        </Text>
        <Text
          style={{
            fontFamily: "Sora, Arial, Helvetica, sans-serif",
            fontWeight: 700,
            fontSize: 22,
            wordBreak: "break-all",
          }}
        >
          {props.rastreio || "Rastreio disponível em Meus pedidos"}
        </Text>
      </Section>
      <Button href={props.rastreioUrl || orderUrl} style={EMAIL_BUTTON_STYLE}>
        {props.rastreioUrl ? "Rastrear entrega" : "Acompanhar pedido"}
      </Button>
      {props.rastreioUrl && (
        <Text>
          <Link href={orderUrl} style={{ color: "#3324F5" }}>
            Ver meu pedido
          </Link>
        </Text>
      )}
      <OrderItems {...props} />
      <EmailAddressBlock endereco={props.endereco} />
    </EmailLayout>
  );
}
