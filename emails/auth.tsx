import * as React from "react";
import { Button, Heading, Text } from "@react-email/components";

import {
  EMAIL_BUTTON_STYLE,
  EMAIL_TITLE_STYLE,
  EmailLayout,
} from "@/emails/components/email-layout";

// Supabase Auth e-mails (sign-up, password reset, e-mail change, magic
// link) with the store's look. Rendered once to supabase/templates/*.html
// (tests/unit/auth-email-templates.test.tsx keeps them in sync); Supabase
// fills the {{ .Placeholders }} (Go templates) when it sends.
const SITE = "{{ .SiteURL }}";
const LINK = "{{ .ConfirmationURL }}";

function AuthEmail({
  preview,
  titulo,
  texto,
  botao,
  rodape,
}: {
  preview: string;
  titulo: string;
  texto: string;
  botao: string;
  rodape: string;
}) {
  return (
    <EmailLayout
      siteUrl={SITE}
      preview={preview}
      motivo="Você recebeu este e-mail por causa da sua conta na Busca Agora."
    >
      <Heading style={EMAIL_TITLE_STYLE}>{titulo}</Heading>
      <Text>{texto}</Text>
      <Button href={LINK} style={EMAIL_BUTTON_STYLE}>
        {botao}
      </Button>
      <Text style={{ color: "#4A4F70", fontSize: 14, marginTop: 24 }}>
        Se o botão não funcionar, copie e cole este endereço no navegador:
        <br />
        {LINK}
      </Text>
      <Text style={{ color: "#4A4F70", fontSize: 14 }}>{rodape}</Text>
    </EmailLayout>
  );
}

export const AUTH_TEMPLATES = {
  confirmation: {
    subject: "Confirme seu cadastro na Busca Agora",
    element: (
      <AuthEmail
        preview="Falta um clique para ativar sua conta."
        titulo="Bem-vindo à Busca Agora!"
        texto="Falta só um passo: confirme seu e-mail para ativar a conta e acompanhar seus pedidos."
        botao="Confirmar meu e-mail"
        rodape="Se você não se cadastrou, é só ignorar este e-mail."
      />
    ),
  },
  recovery: {
    subject: "Criar uma senha nova na Busca Agora",
    element: (
      <AuthEmail
        preview="Pedido de senha nova."
        titulo="Senha nova"
        texto="Recebemos um pedido para criar uma senha nova para a sua conta. O link vale por 1 hora."
        botao="Criar senha nova"
        rodape="Se não foi você, ignore este e-mail: sua senha continua a mesma."
      />
    ),
  },
  email_change: {
    subject: "Confirme seu novo e-mail na Busca Agora",
    element: (
      <AuthEmail
        preview="Confirme a troca do e-mail da sua conta."
        titulo="Troca de e-mail"
        texto="Confirme que este passa a ser o e-mail da sua conta na Busca Agora."
        botao="Confirmar novo e-mail"
        rodape="Se você não pediu essa troca, ignore este e-mail e fale com a gente."
      />
    ),
  },
  magic_link: {
    subject: "Seu link de acesso à Busca Agora",
    element: (
      <AuthEmail
        preview="Entre na sua conta com um clique."
        titulo="Entrar na sua conta"
        texto="Use o botão abaixo para entrar. O link vale por 1 hora e funciona uma vez só."
        botao="Entrar"
        rodape="Se não foi você, ignore este e-mail."
      />
    ),
  },
} as const;

export type AuthTemplateName = keyof typeof AUTH_TEMPLATES;
