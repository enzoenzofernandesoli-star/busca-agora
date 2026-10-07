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
import type { PedidoRecebidoProps } from "@/emails/types";
export const PreviewProps: PedidoRecebidoProps = {
  ...EXAMPLE_ORDER,
  metodo: "pix",
};
export default function PedidoRecebido(props: PedidoRecebidoProps) {
  const text = {
    pix: "Pague o Pix em até 30 minutos para garantir seus produtos. Se o prazo passar, o pedido é cancelado e nada é cobrado.",
    boleto:
      "Pague o boleto em até 3 dias úteis. A compensação leva até 2 dias úteis.",
    card: "Estamos confirmando o pagamento com o cartão. Você recebe outro e-mail assim que for aprovado.",
  };
  return (
    <EmailLayout
      siteUrl={props.siteUrl}
      preview="Seu pedido foi recebido. Confira o próximo passo."
    >
      <Heading style={EMAIL_TITLE_STYLE}>Recebemos seu pedido!</Heading>
      <OrderGreeting nome={props.clienteNome} numero={props.numero} />
      <Text>{text[props.metodo]}</Text>
      <Button
        href={`${props.siteUrl}/conta/pedidos/${props.numero}`}
        style={EMAIL_BUTTON_STYLE}
      >
        Ver meu pedido
      </Button>
      <OrderItems {...props} />
      <EmailAddressBlock endereco={props.endereco} />
    </EmailLayout>
  );
}
