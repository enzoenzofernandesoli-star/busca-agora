import Link from "next/link";
import { LegalPage, StoreIdentity } from "@/components/legal/legal-page";
import { getStoreInfo } from "@/lib/store-info";

export const metadata = {
  title: "Termos de uso",
  description: "Regras de compra e uso da Busca Agora.",
};
export default async function TermsPage() {
  const info = await getStoreInfo();
  return (
    <LegalPage titulo="Termos de uso" atualizadoEm="08/10/2026" aviso>
      <h2>Quem somos</h2>
      <p>
        A Busca Agora vende eletrônicos e cosméticos pela internet, com um único
        vendedor.
      </p>
      <StoreIdentity info={info} />
      <h2>Conta e cadastro</h2>
      <p>
        Informe dados verdadeiros e mantenha seu cadastro atualizado. Você
        precisa ter 18 anos ou contar com seu responsável. Sua senha é pessoal:
        não compartilhe e avise pelo contato se suspeitar de acesso indevido.
      </p>
      <h2>Preços e estoque</h2>
      <p>
        O preço válido é o apresentado na confirmação da compra. A
        disponibilidade depende do estoque. Um erro evidente de preço pode levar
        ao cancelamento do pedido, com aviso e devolução integral do que foi
        pago, respeitados os direitos do consumidor.
      </p>
      <h2>Pagamento</h2>
      <p>
        Pix, cartão e boleto são processados pelo Mercado Pago. A loja não vê
        nem guarda os dados do cartão. O Pix vence em 30 minutos e o boleto em 3
        dias; sem pagamento no prazo, o pedido é cancelado e nada é cobrado.
      </p>
      <h2>Entrega</h2>
      <p>
        O frete e o prazo aparecem antes de pagar. O prazo de entrega começa
        após a confirmação do pagamento. Acompanhe em{" "}
        <Link href="/conta/pedidos">Meus pedidos</Link> ou em{" "}
        <Link href="/rastreio">Rastrear pedido</Link>.
      </p>
      <h2>Trocas e devoluções</h2>
      <p>
        Nas compras online, você pode exercer o direito de arrependimento em até
        7 dias após receber, conforme o art. 49 do Código de Defesa do
        Consumidor. Veja como pedir em{" "}
        <Link href="/trocas">Trocas e devoluções</Link>.
      </p>
      <h2>Nota fiscal</h2>
      <p>
        Os documentos fiscais são emitidos conforme as obrigações aplicáveis à
        venda. Confira os dados informados para emissão; fale com a gente se
        precisar de ajuda com o documento do seu pedido.
      </p>
      <h2>Uso do site</h2>
      <p>
        Não use o site para fraude, acessos indevidos ou automação abusiva que
        prejudique a loja e outros clientes.
      </p>
      <h2>Responsabilidade</h2>
      <p>
        Trabalhamos para manter as informações corretas e o site disponível. Se
        houver falha, vamos ajudar pelo contato. Estes termos não afastam
        garantias nem responsabilidades previstas na legislação de consumo.
      </p>
      <h2>Alterações dos termos</h2>
      <p>
        Atualizações ficam nesta página com a data indicada acima e não retiram
        direitos das compras já realizadas.
      </p>
      <h2>Foro</h2>
      <p>
        Eventuais conflitos podem ser tratados no foro do domicílio do
        consumidor, conforme o Código de Defesa do Consumidor.
      </p>
      <h2>Contato</h2>
      <p>
        Precisa de ajuda? Veja nossos canais em{" "}
        <Link href="/contato">Fale com a gente</Link>.
      </p>
    </LegalPage>
  );
}
