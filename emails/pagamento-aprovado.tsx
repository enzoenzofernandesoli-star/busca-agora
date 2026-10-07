import * as React from "react";
import { Button, Heading, Text } from "@react-email/components";
import {
  EMAIL_BUTTON_STYLE,
  EMAIL_TITLE_STYLE,
  EmailAddressBlock,
  EmailLayout,
  OrderGreeting,
} from "@/emails/components/email-layout";
import { OrderItems } from "@/emails/components/order-items";
import { EXAMPLE_ORDER } from "@/emails/types";
import type { PagamentoAprovadoProps } from "@/emails/types";
export const PreviewProps: PagamentoAprovadoProps = { ...EXAMPLE_ORDER };
export default function PagamentoAprovado(props: PagamentoAprovadoProps) {
  return (
    <EmailLayout
      siteUrl={props.siteUrl}
      preview="Pagamento confirmado. Vamos separar seus produtos."
    >
      <Heading style={EMAIL_TITLE_STYLE}>Pagamento aprovado</Heading>
      <OrderGreeting nome={props.clienteNome} numero={props.numero} />
      <Text>
        Já estamos separando seus produtos. Você recebe o código de rastreio
        assim que o pedido sair.
      </Text>
      <Button
        href={`${props.siteUrl}/conta/pedidos/${props.numero}`}
        style={EMAIL_BUTTON_STYLE}
      >
        Acompanhar pedido
      </Button>
      <OrderItems {...props} />
      <EmailAddressBlock endereco={props.endereco} />
    </EmailLayout>
  );
}
