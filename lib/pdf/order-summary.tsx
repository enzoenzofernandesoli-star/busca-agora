/* eslint-disable jsx-a11y/alt-text -- react-pdf Image is a PDF primitive, not a DOM image. */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";

export type OrderSummaryData = {
  numero: string;
  criadoEm: string;
  cliente: { nome: string; telefone: string | null };
  endereco: {
    rua: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  itens: { nome: string; sku: string; quantidade: number }[];
  freteServico: string | null;
  transportadora: string | null;
  notaManual: boolean;
  adminUrl: string;
};
export const MANUAL_INVOICE_TEXT = "EMITIR NOTA FISCAL À MÃO";
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000000",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: 170,
    paddingBottom: 121,
  },
  header: { position: "absolute", top: 14, left: 14, right: 14 },
  title: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000000",
    paddingBottom: 5,
    marginBottom: 5,
  },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 16 },
  number: { fontFamily: "Helvetica-Bold", fontSize: 18 },
  line: { marginBottom: 3, maxLines: 1, textOverflow: "ellipsis" },
  customer: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginTop: 5,
    maxLines: 1,
    textOverflow: "ellipsis",
  },
  columns: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginTop: 6,
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    paddingVertical: 5,
    minHeight: 30,
  },
  quantity: { width: 30, fontFamily: "Helvetica-Bold", fontSize: 14 },
  sku: {
    width: 66,
    fontSize: 7,
    paddingRight: 5,
  },
  name: { flex: 1, fontSize: 9, maxLines: 2, textOverflow: "ellipsis" },
  footer: { position: "absolute", bottom: 14, left: 14, right: 14 },
  warning: {
    borderWidth: 2,
    borderColor: "#000000",
    padding: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 6,
  },
  qrRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  qr: { width: 70, height: 70 },
  footerText: { fontSize: 10, fontFamily: "Helvetica-Bold" },
});
function cut(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}
function orderDate(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime()))
    throw new Error("Data do pedido inválida");
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
}
export function OrderSummaryDocument({
  data,
  qrDataUrl,
}: {
  data: OrderSummaryData;
  qrDataUrl: string;
}) {
  const e = data.endereco;
  const total = data.itens.reduce((sum, item) => sum + item.quantidade, 0);
  return (
    <Document title={`Resumo ${data.numero}`} author="Busca Agora">
      <Page size={[283.46, 425.2]} style={styles.page} wrap>
        <View fixed style={styles.header}>
          <View style={styles.title}>
            <Text style={styles.brand}>BUSCA AGORA</Text>
            <Text style={styles.number}>{data.numero}</Text>
          </View>
          <Text style={styles.line}>{orderDate(data.criadoEm)}</Text>
          <Text style={styles.line}>
            {data.freteServico ?? "Serviço não informado"} ·{" "}
            {data.transportadora ?? "Transportadora não informada"}
          </Text>
          <Text style={styles.customer}>{cut(data.cliente.nome, 55)}</Text>
          {data.cliente.telefone && (
            <Text style={styles.line}>{data.cliente.telefone}</Text>
          )}
          <Text style={styles.line}>
            {cut(
              `${e.rua}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ""}`,
              65,
            )}
          </Text>
          <Text style={styles.line}>
            {cut(`${e.bairro} - ${e.cidade}/${e.uf}`, 65)}
          </Text>
          <Text style={styles.line}>
            CEP {e.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
          </Text>
          <View style={styles.columns}>
            <Text style={{ width: 30, fontFamily: "Helvetica-Bold" }}>Qtd</Text>
            <Text style={{ width: 66, fontFamily: "Helvetica-Bold" }}>SKU</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Produto</Text>
          </View>
        </View>
        {data.itens.map((item, index) => (
          <View key={`${item.sku}-${index}`} style={styles.row} wrap={false}>
            <Text style={styles.quantity}>{item.quantidade}</Text>
            <Text style={styles.sku}>{item.sku}</Text>
            <Text style={styles.name}>{cut(item.nome, 60)}</Text>
          </View>
        ))}
        <View fixed style={styles.footer}>
          {data.notaManual && (
            <Text style={styles.warning}>{MANUAL_INVOICE_TEXT}</Text>
          )}
          <View style={styles.qrRow}>
            <Image src={qrDataUrl} style={styles.qr} />
            <View>
              <Text style={styles.footerText}>Abrir no painel</Text>
              <Text>
                {total} {total === 1 ? "item" : "itens"}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
export async function renderOrderSummary(
  data: OrderSummaryData,
): Promise<Buffer> {
  if (
    !data.itens.length ||
    data.itens.some(
      (item) => !Number.isSafeInteger(item.quantidade) || item.quantidade < 1,
    )
  )
    throw new Error("Itens do pedido inválidos");
  const qrDataUrl = await QRCode.toDataURL(data.adminUrl, {
    margin: 0,
    width: 240,
    errorCorrectionLevel: "M",
  });
  return renderToBuffer(
    <OrderSummaryDocument data={data} qrDataUrl={qrDataUrl} />,
  );
}
