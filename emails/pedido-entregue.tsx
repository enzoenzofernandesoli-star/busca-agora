import * as React from "react";
import { Button, Heading, Link, Text } from "@react-email/components";
import {
  EMAIL_BUTTON_STYLE,
  EMAIL_TITLE_STYLE,
  EmailAddressBlock,
  EmailLayout,
  OrderGreeting,
} from "@/emails/components/email-layout";
import { EXAMPLE_ORDER } from "@/emails/types";
import type { PedidoEntregueProps } from "@/emails/types";
import { formatBRL } from "@/lib/format";
export const PreviewProps: PedidoEntregueProps = { ...EXAMPLE_ORDER };
export default function PedidoEntregue(props: PedidoEntregueProps) {
  return (
    <EmailLayout
      siteUrl={props.siteUrl}
      preview="Seu pedido foi entregue. Conte com a gente."
    >
      <Heading style={EMAIL_TITLE_STYLE}>Pedido entregue</Heading>
      <OrderGreeting nome={props.clienteNome} numero={props.numero} />
      <Text>
        Esperamos que goste! Se algo não estiver certo, você pode pedir troca ou
        devolução em até 7 dias pelo seu pedido.
      </Text>
      <Text>Total do pedido: {formatBRL(props.totalCents)}</Text>
      <Button
        href={`${props.siteUrl}/conta/pedidos/${props.numero}`}
        style={EMAIL_BUTTON_STYLE}
      >
        Ver meu pedido
      </Button>
      <Text>
        <Link href={`${props.siteUrl}/trocas`} style={{ color: "#3324F5" }}>
          Política de trocas
        </Link>
      </Text>
      <EmailAddressBlock endereco={props.endereco} />
    </EmailLayout>
  );
}
