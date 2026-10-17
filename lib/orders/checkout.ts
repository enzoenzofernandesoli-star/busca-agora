"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";

import { fieldErrors } from "@/lib/auth/schemas";
import { allowAttempt } from "@/lib/auth/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { getCart } from "@/lib/cart/server";
import { createAdminClient } from "@/lib/db/admin";
import { createClient } from "@/lib/db/server";
import { echoValues, type FormState } from "@/lib/forms/state";
import { recordProductEvents, requestContext } from "@/lib/metrics/events";
import { getPaymentProvider } from "@/lib/payments";
import { quoteShipping } from "@/lib/shipping/quote";

import {
  checkoutSchema,
  newAddressSchema,
  PAYMENT_WINDOW,
  PAYMENT_WINDOW_MS,
} from "./checkout-schema";

type Endereco = {
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
};

const fail = (message: string, formData: FormData): FormState => ({
  ok: false,
  message,
  values: echoValues(formData),
});

/**
 * Places the order (CLAUDE.md section 5, steps 2-3). Everything that costs
 * money is recalculated here: items and prices from the database (inside
 * create_order), shipping re-quoted for the chosen service. The order and
 * the stock reservation happen in one transaction; then the customer goes
 * to Mercado Pago's own page. Status never changes here: only the webhook
 * marks an order paid.
 */
export async function placeOrder(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/checkout");
  const raw = Object.fromEntries(formData);

  const parsed = checkoutSchema.safeParse(raw);
  const addressParsed =
    raw.enderecoId === "novo" ? newAddressSchema.safeParse(raw) : null;
  if (!parsed.success || (addressParsed && !addressParsed.success)) {
    return {
      ok: false,
      message: "Confira os campos destacados.",
      fieldErrors: {
        ...(parsed.success ? {} : fieldErrors(parsed.error)),
        ...(addressParsed && !addressParsed.success
          ? fieldErrors(addressParsed.error)
          : {}),
      },
      values: echoValues(formData),
    };
  }
  const { enderecoId, cpf, freteServicoId, pagamento } = parsed.data;

  if (!(await allowAttempt([{ kind: "checkout:usuario", value: user.id }]))) {
    return fail(
      "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.",
      formData,
    );
  }

  const supabase = await createClient();

  // Delivery address: a saved one (RLS: only the customer's own) or a new one.
  let endereco: Endereco;
  if (addressParsed?.success) {
    const { salvarEndereco, ...campos } = addressParsed.data;
    endereco = { ...campos, complemento: campos.complemento ?? null };
    if (salvarEndereco) {
      await supabase.rpc("save_address", {
        p_cep: campos.cep,
        p_rua: campos.rua,
        p_numero: campos.numero,
        p_complemento: campos.complemento,
        p_bairro: campos.bairro,
        p_cidade: campos.cidade,
        p_uf: campos.uf,
        p_principal: false,
      });
    }
  } else {
    const { data } = await supabase
      .from("addresses")
      .select("cep, rua, numero, complemento, bairro, cidade, uf")
      .eq("id", enderecoId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data)
      return fail("Esse endereço não existe mais. Escolha outro.", formData);
    endereco = data;
  }

  // Cart as it is now in the database.
  const cart = await getCart();
  const linhas = cart.linhas.filter((l) => l.disponivel);
  if (linhas.length === 0) return fail("Seu carrinho está vazio.", formData);
  if (
    linhas.length !== cart.linhas.length ||
    linhas.some((l) => l.quantidade > l.estoque)
  ) {
    return fail(
      "Alguns itens do carrinho mudaram ou esgotaram. Volte ao carrinho para conferir.",
      formData,
    );
  }
  const itens = linhas.map((l) => ({
    variantId: l.variantId,
    quantidade: l.quantidade,
  }));

  // Shipping re-quoted on the server for the chosen service.
  const quote = await quoteShipping({ cep: endereco.cep, itens });
  const opcao = quote.ok
    ? quote.opcoes.find((o) => o.servicoId === freteServicoId)
    : undefined;
  if (!opcao) {
    return fail(
      "O frete escolhido não está mais disponível para esse CEP. Escolha de novo.",
      formData,
    );
  }

  // Optional marketing consent (LGPD): only ever turns it on, never off here.
  if (formData.get("marketing") === "on") {
    await supabase.rpc("set_my_marketing_consent", {
      p_opt_in: true,
      p_channels: ["email", "whatsapp"],
    });
  }

  // The customer's CPF goes to the profile the first time (column grant).
  await supabase
    .from("profiles")
    .update({ cpf })
    .eq("id", user.id)
    .is("cpf", null);

  // Visitor and origin (cookies re-validated on the server) for the order
  // and the metrics.
  const ctx = await requestContext();
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .rpc("create_order", {
      p_user_id: user.id,
      p_endereco: endereco,
      p_cliente_nome: user.nome,
      p_cliente_cpf: cpf,
      p_payment_method: pagamento,
      p_frete_cents: opcao.precoCents,
      p_frete_servico: opcao.servico,
      p_frete_servico_id: Number(opcao.servicoId),
      p_itens: itens.map((i) => ({
        variant_id: i.variantId,
        quantidade: i.quantidade,
      })),
      p_validade: PAYMENT_WINDOW[pagamento],
      // Re-validated here: the cookie is written by the browser.
      p_origem: { ...(ctx.origem ?? {}), visitor_id: ctx.visitorId },
    })
    .single<{ id: string; numero: string; total_cents: number }>();
  if (error || !order) {
    if (
      error?.message === "insufficient_stock" ||
      error?.message === "variant_not_found"
    ) {
      return fail(
        "Um dos produtos acabou de esgotar. Volte ao carrinho para conferir.",
        formData,
      );
    }
    throw new Error(`create_order: ${error?.message ?? "sem retorno"}`);
  }

  // Metrics: begin_checkout per product, after the response.
  after(() =>
    recordProductEvents(
      ctx,
      "begin_checkout",
      linhas.map((l) => ({ productId: l.productId, variantId: l.variantId })),
      { userId: user.id, orderId: order.id },
    ),
  );

  const { data: orderItems, error: itemsError } = await admin
    .from("order_items")
    .select("sku, nome, quantidade, preco_cents")
    .eq("order_id", order.id);
  if (itemsError) throw new Error(`order_items: ${itemsError.message}`);

  let url: string;
  try {
    const session = await getPaymentProvider().createCheckout({
      id: order.id,
      numero: order.numero,
      totalCents: order.total_cents,
      freteCents: opcao.precoCents,
      freteServico: opcao.servico,
      pagamento,
      cliente: { nome: user.nome, email: user.email, cpf },
      itens: (orderItems ?? []).map((i) => ({
        sku: i.sku,
        nome: i.nome,
        quantidade: i.quantidade,
        precoCents: i.preco_cents,
      })),
      expiresAt: new Date(Date.now() + PAYMENT_WINDOW_MS[pagamento]),
    });
    await admin
      .from("orders")
      .update({ mp_preference_id: session.preferenceId })
      .eq("id", order.id);
    url = session.url;
  } catch (e) {
    // No payment page: give the stock back right away.
    await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "canceled",
      p_detalhe: { motivo: "pagamento_indisponivel" },
    });
    Sentry.captureException(e);
    return fail(
      "Não conseguimos abrir o pagamento agora. Nada foi cobrado; tente de novo em instantes.",
      formData,
    );
  }

  revalidatePath("/carrinho");
  redirect(url);
}
