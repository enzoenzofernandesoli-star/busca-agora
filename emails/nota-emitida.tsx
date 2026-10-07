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
import type { NotaEmitidaProps } from "@/emails/types";
import { formatBRL } from "@/lib/format";
export const PreviewProps: NotaEmitidaProps = {
  ...EXAMPLE_ORDER,
  danfeUrl: null,
};
export default function NotaEmitida(props: NotaEmitidaProps) {
  const orderUrl = `${props.siteUrl}/conta/pedidos/${props.numero}`;
  return (
    <EmailLayout
      siteUrl={props.siteUrl}
      preview="Sua nota fiscal já pode ser consultada."
    >
      <Heading style={EMAIL_TITLE_STYLE}>Sua nota fiscal está pronta</Heading>
      <OrderGreeting nome={props.clienteNome} numero={props.numero} />
      <Text>Total do pedido: {formatBRL(props.totalCents)}</Text>
      {props.danfeUrl ? (
        <>
          <Button href={props.danfeUrl} style={EMAIL_BUTTON_STYLE}>
            Baixar nota fiscal (PDF)
          </Button>
          <Text>
            <Link href={orderUrl} style={{ color: "#3324F5" }}>
              Ver meu pedido
            </Link>
          </Text>
        </>
      ) : (
        <>
          <Text>A nota fica disponível em Meus pedidos.</Text>
          <Button href={orderUrl} style={EMAIL_BUTTON_STYLE}>
            Ver meu pedido
          </Button>
        </>
      )}
      <EmailAddressBlock endereco={props.endereco} />
    </EmailLayout>
  );
}
