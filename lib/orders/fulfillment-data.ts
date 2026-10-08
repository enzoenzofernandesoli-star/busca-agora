import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import type { Database } from "@/lib/db/types";
import type {
  LabelInput,
  LabelItem,
  LabelParty,
} from "@/lib/shipping/melhorenvio/label-request";

import { parseOrderAddress } from "./address";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/** Everything the invoice, label and print jobs need about one order. */
export async function loadFulfillment(orderId: string) {
  const admin = createAdminClient();
  const [{ data: o, error }, { data: s }] = await Promise.all([
    admin
      .from("orders")
      .select(
        `id, numero, status, created_at, user_id, cliente_nome, cliente_cpf,
         cliente_email, endereco, frete_servico, frete_servico_id,
         order_items(nome, sku, preco_cents, quantidade,
           product_variants(peso_g, altura_cm, largura_cm, comprimento_cm)),
         shipments(id, me_order_id, me_status, transportadora, servico, impressoes,
           rastreio, etiqueta_path, resumo_path, status),
         invoices(status, chave, danfe_url),
         profiles(telefone)`,
      )
      .eq("id", orderId)
      .single(),
    admin
      .from("settings")
      .select(
        "razao_social, cnpj, cpf_vendedor, email_contato, whatsapp, endereco_origem, printer_id",
      )
      .eq("id", true)
      .single(),
  ]);
  if (error || !o) {
    throw new Error(`pedido ${orderId}: ${error?.message ?? "não encontrado"}`);
  }

  const endereco = parseOrderAddress(o.endereco);
  const origem = parseOrderAddress(s?.endereco_origem ?? null);
  const telefoneLoja = s?.whatsapp ? s.whatsapp.replace(/^55/, "") : null;

  const remetente: LabelParty = {
    nome: s?.razao_social ?? "",
    telefone: telefoneLoja,
    email: s?.email_contato ?? null,
    documento: s?.cnpj ?? s?.cpf_vendedor ?? "",
    rua: origem.rua,
    numero: origem.numero,
    complemento: origem.complemento,
    bairro: origem.bairro,
    cidade: origem.cidade,
    uf: origem.uf,
    cep: origem.cep,
  };
  const destinatario: LabelParty = {
    nome: o.cliente_nome,
    telefone: one(o.profiles)?.telefone ?? null,
    email: o.cliente_email,
    documento: o.cliente_cpf,
    ...endereco,
  };
  const itens: LabelItem[] = o.order_items.map((i) => {
    const v = one(i.product_variants);
    return {
      nome: i.nome,
      quantidade: i.quantidade,
      precoCents: i.preco_cents,
      pesoG: v?.peso_g ?? 0,
      alturaCm: Number(v?.altura_cm ?? 0),
      larguraCm: Number(v?.largura_cm ?? 0),
      comprimentoCm: Number(v?.comprimento_cm ?? 0),
    };
  });
  const invoice = one(o.invoices);

  return {
    id: o.id,
    numero: o.numero,
    status: o.status as OrderStatus,
    criadoEm: o.created_at,
    clienteNome: o.cliente_nome,
    telefone: destinatario.telefone,
    endereco,
    freteServico: o.frete_servico,
    freteServicoId: o.frete_servico_id,
    itens: o.order_items.map((i) => ({
      nome: i.nome,
      sku: i.sku,
      quantidade: i.quantidade,
    })),
    shipment: one(o.shipments),
    invoice,
    printerId: s?.printer_id ?? null,
    label: (servicoId: number): LabelInput => ({
      numero: o.numero,
      servicoId,
      remetente,
      destinatario,
      itens,
      notaChave: invoice?.chave ?? null,
    }),
  };
}

export type Fulfillment = Awaited<ReturnType<typeof loadFulfillment>>;
