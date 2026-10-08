import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { EmailAddress } from "@/emails/types";

export const EMAIL_TITLE_STYLE: React.CSSProperties = {
  fontFamily: "Sora, Arial, Helvetica, sans-serif",
  color: "#0A0F3D",
  fontWeight: 800,
  fontSize: 26,
  lineHeight: "34px",
};
export const EMAIL_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: "#3324F5",
  color: "#FFFFFF",
  borderRadius: 14,
  padding: "14px 24px",
  fontFamily: "Sora, Arial, Helvetica, sans-serif",
  fontWeight: 700,
  fontSize: 16,
  lineHeight: "24px",
  textDecoration: "none",
  display: "inline-block",
};
export function EmailAddressBlock({ endereco }: { endereco: EmailAddress }) {
  return (
    <Section
      style={{ borderTop: "1px solid #E3E5F2", marginTop: 24, paddingTop: 16 }}
    >
      <Text style={{ fontWeight: 700, marginBottom: 8 }}>
        Endereço de entrega
      </Text>
      <Text style={{ color: "#4A4F70", margin: 0 }}>
        {endereco.rua}, {endereco.numero}
        {endereco.complemento ? ` — ${endereco.complemento}` : ""}
        <br />
        {endereco.bairro} · {endereco.cidade}/{endereco.uf}
        <br />
        CEP {endereco.cep}
      </Text>
    </Section>
  );
}
export function OrderGreeting({
  nome,
  numero,
}: {
  nome: string;
  numero: string;
}) {
  return (
    <>
      <Text>Olá, {nome.trim().split(/\s+/)[0] || "cliente"}!</Text>
      <Text
        style={{
          fontFamily: "Sora, Arial, Helvetica, sans-serif",
          fontWeight: 700,
        }}
      >
        Pedido {numero}
      </Text>
    </>
  );
}
export function EmailLayout({
  siteUrl,
  preview,
  children,
  motivo = "Você recebeu este e-mail porque fez um pedido na Busca Agora.",
}: {
  siteUrl: string;
  preview: string;
  children: React.ReactNode;
  /** Why the person got this e-mail (footer). */
  motivo?: string;
}) {
  const linkStyle: React.CSSProperties = {
    color: "#DCDFFF",
    fontSize: 14,
    marginRight: 16,
    textDecoration: "underline",
  };
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        lang="pt-BR"
        style={{
          backgroundColor: "#F4F5FA",
          color: "#0A0F3D",
          fontFamily: "DM Sans, Arial, Helvetica, sans-serif",
          margin: 0,
          padding: "24px 12px",
        }}
      >
        <Container style={{ maxWidth: 600, width: "100%", margin: "0 auto" }}>
          <Section
            style={{
              backgroundColor: "#3324F5",
              padding: 24,
              borderRadius: "22px 22px 0 0",
            }}
          >
            <Img
              src={`${siteUrl}/brand/logo-email.png`}
              width={160}
              height={40}
              alt="Busca Agora"
              style={{ display: "block" }}
            />
          </Section>
          <Section
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E3E5F2",
              borderRadius: 22,
              padding: 24,
            }}
          >
            {children}
          </Section>
          <Section
            style={{
              backgroundColor: "#0A0F3D",
              padding: 24,
              marginTop: 16,
              borderRadius: 22,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "Sora, Arial, Helvetica, sans-serif",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Buscou? <span style={{ color: "#C6FF3D" }}>Tá aqui.</span>
            </Text>
            <Link href={`${siteUrl}/conta/pedidos`} style={linkStyle}>
              Meus pedidos
            </Link>
            <Link href={`${siteUrl}/trocas`} style={linkStyle}>
              Trocas e devoluções
            </Link>
            <Link href={`${siteUrl}/contato`} style={linkStyle}>
              Contato
            </Link>
            <Text
              style={{ color: "#DCDFFF", fontSize: 12, lineHeight: "18px" }}
            >
              {motivo}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
