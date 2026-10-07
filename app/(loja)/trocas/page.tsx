import Link from "next/link";
import { LegalPage, StoreIdentity } from "@/components/legal/legal-page";
import { getStoreInfo } from "@/lib/store-info";

export const metadata = {
  title: "Trocas e devoluções",
  description: "Prazos e orientações para trocar ou devolver seu pedido.",
};
export default async function ReturnsPage() {
  const info = await getStoreInfo();
  return (
    <LegalPage titulo="Trocas e devoluções" atualizadoEm="08/10/2026" aviso>
      <h2 id="arrependimento">Desistiu? Até 7 dias</h2>
      <p>
        Você tem até 7 dias corridos após receber para desistir da compra
        online, sem precisar explicar, conforme o art. 49 do CDC. Envie o
        produto com a embalagem e os acessórios disponíveis. O frete de volta é
        por nossa conta e o reembolso é integral, pela mesma forma de pagamento.
      </p>
      <p>
        Solicitamos a devolução do Pix imediatamente; a disponibilidade depende
        do processamento do pagamento. No cartão, o estorno pode aparecer em até
        2 faturas, conforme o banco.
      </p>
      <h2 id="defeito">Produto com defeito</h2>
      <p>
        O prazo para reclamar é de 30 dias para produtos não duráveis, como
        cosméticos, ou 90 dias para duráveis, como eletrônicos, conforme o art.
        26 do CDC. Para defeito oculto, o prazo começa quando ele ficar
        evidente. Fale com a gente para avaliar troca, conserto ou devolução do
        valor nos termos da lei, inclusive o prazo de solução previsto no art.
        18.
      </p>
      <h2 id="como-pedir">Como pedir</h2>
      <ol>
        <li>
          Entre em <Link href="/conta/pedidos">Minha conta → Pedidos</Link>.
        </li>
        <li>Abra o pedido e escolha “Pedir troca ou devolução”.</li>
        <li>
          Sem conta, ou se o botão não estiver disponível, fale pelo{" "}
          <Link href="/contato">contato</Link>.
        </li>
      </ol>
      <p>Respondemos em até 1 dia útil e enviamos a etiqueta de devolução.</p>
      <h2 id="cosmeticos">Higiene e cosméticos</h2>
      <p>
        Para trocas voluntárias, mantenha o lacre intacto; produtos abertos ou
        usados são avaliados em caso de defeito ou reação adversa comprovada.
        Essas orientações não restringem o direito legal de arrependimento em
        compras online nem as garantias previstas no CDC. Se houver reação,
        interrompa o uso e entre em contato.
      </p>
      <h2 id="pagamento">Formas de pagamento</h2>
      <p>
        Pix tem aprovação na hora; cartão de crédito tem parcelamento
        apresentado no pagamento; boleto vence em 3 dias e a compensação pode
        levar até 2 dias úteis depois de pago. Tudo é processado pelo Mercado
        Pago. A loja não vê o número do cartão.
      </p>
      <h2 id="entrega">Entrega</h2>
      <p>
        O prazo começa após o pagamento aprovado. Acompanhe em{" "}
        <Link href="/conta/pedidos">Meus pedidos</Link> ou em{" "}
        <Link href="/rastreio">Rastrear pedido</Link>.
      </p>
      <StoreIdentity info={info} />
    </LegalPage>
  );
}
