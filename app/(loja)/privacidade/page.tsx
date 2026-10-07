import Link from "next/link";

import { LegalPage, StoreIdentity } from "@/components/legal/legal-page";
import { getStoreInfo } from "@/lib/store-info";

export const metadata = {
  title: "Política de privacidade",
  description:
    "Quais dados a Busca Agora coleta, para que usa, com quem compartilha e como você exerce seus direitos (LGPD).",
};

// Written against what the store really does (CLAUDE.md sections 5-6):
// keep it in sync when an integration or a stored field changes.
export default async function PrivacyPage() {
  const info = await getStoreInfo();
  return (
    <LegalPage titulo="Política de privacidade" atualizadoEm="08/10/2026" aviso>
      <p>
        Esta política explica, em linguagem simples, como a Busca Agora trata
        seus dados pessoais, seguindo a Lei Geral de Proteção de Dados (Lei
        13.709/2018, LGPD). Ela vale para o site, o app instalado no celular e o
        atendimento.
      </p>

      <h2 id="controlador">Quem cuida dos seus dados</h2>
      <p>
        O controlador dos dados é a Busca Agora, identificada abaixo. É quem
        decide como os dados são usados e responde por eles.
      </p>
      <StoreIdentity info={info} />

      <h2 id="dados">Quais dados coletamos</h2>
      <ul>
        <li>
          <strong>Cadastro:</strong> nome, e-mail, senha (guardada só de forma
          criptografada, nem nós conseguimos ver), CPF e telefone. Se você
          entrar com o Google, recebemos do Google só seu nome e e-mail.
        </li>
        <li>
          <strong>Endereços:</strong> os endereços de entrega que você salvar.
        </li>
        <li>
          <strong>Compras:</strong> produtos, valores, frete, endereço e CPF do
          pedido (uma cópia fica no pedido, como exige a nota fiscal), forma de
          pagamento e o resultado do pagamento informado pelo Mercado Pago.{" "}
          <strong>Não recebemos nem guardamos o número do cartão</strong>: ele é
          digitado no ambiente do Mercado Pago.
        </li>
        <li>
          <strong>Trocas e atendimento:</strong> o que você contar ao pedir
          troca ou devolução e as mensagens que mandar ao contato.
        </li>
        <li>
          <strong>Carrinho:</strong> os produtos que você adicionar, mesmo sem
          conta, ligados a um código no seu navegador.
        </li>
        <li>
          <strong>Segurança:</strong> para barrar tentativas repetidas de login
          e cadastro, guardamos uma marca embaralhada (que não dá para reverter)
          do seu endereço de internet (IP) e do e-mail usado, por pouco tempo.
        </li>
      </ul>
      <p>
        Não coletamos dados sensíveis (saúde, religião, biometria etc.) e não
        usamos seus dados para criar perfis de publicidade.
      </p>

      <h2 id="finalidades">Para que usamos e com qual base legal</h2>
      <ul>
        <li>
          <strong>Fazer a sua compra acontecer</strong> (criar a conta, calcular
          o frete, receber o pagamento, separar, emitir nota, entregar, avisar
          sobre o pedido e atender trocas): execução de contrato (LGPD, art. 7º,
          V).
        </li>
        <li>
          <strong>Cumprir a lei</strong> (nota fiscal, registros fiscais e de
          consumo, pedidos de autoridades): obrigação legal (art. 7º, II).
        </li>
        <li>
          <strong>Proteger você e a loja</strong> (evitar fraude, invasão de
          conta e abuso do site): legítimo interesse (art. 7º, IX), sempre no
          mínimo necessário.
        </li>
        <li>
          <strong>Defender direitos</strong> em eventual reclamação ou processo:
          exercício regular de direitos (art. 7º, VI).
        </li>
      </ul>
      <p>
        Os e-mails que mandamos são sobre os seus pedidos. Se um dia enviarmos
        novidades ou ofertas, será só com o seu consentimento, e você poderá
        cancelar a qualquer momento.
      </p>

      <h2 id="compartilhamento">Com quem compartilhamos</h2>
      <p>
        Só com quem precisamos para vender e entregar, e só o necessário para
        cada um:
      </p>
      <ul>
        <li>
          <strong>Mercado Pago:</strong> processa o pagamento (Pix, cartão,
          boleto).
        </li>
        <li>
          <strong>Melhor Envio e transportadoras</strong> (como os Correios):
          nome, endereço, telefone e itens para gerar a etiqueta e entregar.
        </li>
        <li>
          <strong>Emissor de nota fiscal</strong> e a Secretaria da Fazenda:
          dados exigidos na nota.
        </li>
        <li>
          <strong>Serviços de tecnologia</strong> que guardam e fazem o site
          funcionar: hospedagem (Vercel), banco de dados e login (Supabase),
          envio de e-mails (Resend) e registro de erros do site (Sentry).
        </li>
        <li>
          <strong>Autoridades</strong>, quando a lei ou uma ordem judicial
          exigir.
        </li>
      </ul>
      <p>
        <strong>Nunca vendemos seus dados.</strong> Os avisos internos que a
        equipe recebe (por exemplo, no Telegram) trazem só o número do pedido, o
        valor e a cidade, sem seu nome, CPF ou contato.
      </p>

      <h2 id="internacional">Dados guardados fora do Brasil</h2>
      <p>
        Alguns desses serviços de tecnologia guardam dados em servidores fora do
        Brasil. Nesses casos, usamos empresas que seguem padrões de proteção
        compatíveis com a LGPD, com contrato que garante a segurança e o uso só
        para nos atender (LGPD, art. 33).
      </p>

      <h2 id="prazos">Por quanto tempo guardamos</h2>
      <ul>
        <li>
          <strong>Pedidos e notas fiscais:</strong> 5 anos depois da compra,
          como exige a lei fiscal.
        </li>
        <li>
          <strong>Conta, endereços e carrinho:</strong> enquanto a conta
          existir. Quando você exclui a conta, apagamos o cadastro e os
          endereços; os pedidos continuam guardados pelo prazo fiscal, sem
          ligação com a conta.
        </li>
        <li>
          <strong>Marcas de segurança (IP e e-mail embaralhados):</strong>
          minutos ou horas, só o tempo do limite de tentativas.
        </li>
        <li>
          <strong>Carrinho sem conta:</strong> some quando você limpa os cookies
          do navegador.
        </li>
      </ul>

      <h2 id="cookies">Cookies</h2>
      <p>
        Usamos <strong>só cookies necessários</strong> para o site funcionar:
      </p>
      <ul>
        <li>sessão de login (manter você conectado);</li>
        <li>carrinho (lembrar o que você adicionou);</li>
        <li>abertura animada (mostrar só na primeira visita);</li>
        <li>aviso de cookies (não mostrar o aviso de novo).</li>
      </ul>
      <p>
        Não usamos cookies de anúncios, de redes sociais nem de rastreio de
        terceiros. O app instalado também guarda no seu celular uma cópia da
        página &quot;Sem conexão&quot; e das imagens da marca, para abrir mais
        rápido; nada da sua conta fica nessa cópia.
      </p>

      <h2 id="direitos">Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
      <ul>
        <li>confirmar se tratamos seus dados e ter acesso a eles;</li>
        <li>corrigir dados incompletos ou errados;</li>
        <li>
          pedir a exclusão, o bloqueio ou a anonimização do que não for
          necessário ou estiver em desacordo com a lei;
        </li>
        <li>pedir a portabilidade dos dados para outro fornecedor;</li>
        <li>saber com quem compartilhamos;</li>
        <li>
          retirar um consentimento que tenha dado e se opor a um tratamento que
          considere irregular.
        </li>
      </ul>
      <p>
        Você mesmo pode corrigir seus dados e excluir a conta em{" "}
        <Link href="/conta">Minha conta</Link>. Para os outros pedidos, escreva
        para o e-mail de contato abaixo. Respondemos em até 15 dias e, para
        proteger você, podemos pedir uma confirmação de que a conta é sua. Você
        também pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD),
        em{" "}
        <a
          href="https://www.gov.br/anpd"
          target="_blank"
          rel="noopener noreferrer"
        >
          gov.br/anpd
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
        .
      </p>

      <h2 id="seguranca">Como protegemos</h2>
      <ul>
        <li>conexão sempre criptografada (HTTPS);</li>
        <li>senhas guardadas só de forma criptografada;</li>
        <li>
          cada cliente só enxerga os próprios pedidos, endereços e notas, com
          regras no próprio banco de dados;
        </li>
        <li>acesso da equipe só ao que cada função precisa;</li>
        <li>dados do cartão nunca passam pelo nosso sistema.</li>
      </ul>
      <p>
        Se acontecer um incidente de segurança que possa trazer risco a você,
        avisaremos você e a ANPD, como manda a lei. Cuide também da sua senha:
        não use a mesma de outros sites e não compartilhe.
      </p>

      <h2 id="menores">Menores de idade</h2>
      <p>
        A loja é para maiores de 18 anos. Menores só podem comprar com um
        responsável, que faz o cadastro em seu próprio nome.
      </p>

      <h2 id="encarregado">Encarregado de dados e contato</h2>
      <p>
        Para qualquer assunto sobre seus dados, fale com o encarregado pelo
        e-mail de contato da loja
        {info.email ? (
          <>
            : <a href={`mailto:${info.email}`}>{info.email}</a>
          </>
        ) : (
          " [a preencher]"
        )}
        .
      </p>

      <h2 id="mudancas">Mudanças nesta política</h2>
      <p>
        Quando esta política mudar, a data no topo é atualizada. Se a mudança
        for importante para você, avisamos também por e-mail ou no site.
      </p>
    </LegalPage>
  );
}
