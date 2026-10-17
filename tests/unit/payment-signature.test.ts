import { describe, expect, it } from "vitest";

import {
  parseSignatureHeader,
  signatureManifest,
  signWebhook,
  verifyWebhookSignature,
} from "@/lib/payments/signature";

const secret = "segredo-de-teste";
const now = new Date("2026-10-17T12:00:00Z");
const ts = String(now.getTime());

function header(dataId: string, requestId: string, t = ts) {
  const v1 = signWebhook(
    secret,
    signatureManifest({ dataId, requestId, ts: t }),
  );
  return `ts=${t},v1=${v1}`;
}

describe("assinatura do webhook do Mercado Pago", () => {
  it("monta o manifesto da documentação", () => {
    expect(
      signatureManifest({
        dataId: "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3",
        requestId: "2066ca19-c6f1-498a-be75-1923005edd06",
        ts: "1742505638683",
      }),
    ).toBe(
      "id:ord01jq4s4ky8hwq6na5pxb65b3d3;request-id:2066ca19-c6f1-498a-be75-1923005edd06;ts:1742505638683;",
    );
    expect(signatureManifest({ dataId: null, requestId: null, ts: "1" })).toBe(
      "ts:1;",
    );
  });

  it("aceita a assinatura certa", () => {
    expect(
      verifyWebhookSignature({
        header: header("123", "req-1"),
        requestId: "req-1",
        dataId: "123",
        secret,
        now,
      }),
    ).toBe(true);
  });

  it("recusa id, request-id ou segredo diferentes", () => {
    const h = header("123", "req-1");
    const base = { header: h, requestId: "req-1", dataId: "123", secret, now };
    expect(verifyWebhookSignature({ ...base, dataId: "124" })).toBe(false);
    expect(verifyWebhookSignature({ ...base, requestId: "req-2" })).toBe(false);
    expect(verifyWebhookSignature({ ...base, secret: "outro" })).toBe(false);
    expect(verifyWebhookSignature({ ...base, secret: "" })).toBe(false);
  });

  it("recusa cabeçalho ausente, malformado ou velho demais", () => {
    const base = { requestId: "req-1", dataId: "123", secret, now };
    expect(verifyWebhookSignature({ ...base, header: null })).toBe(false);
    expect(verifyWebhookSignature({ ...base, header: "ts=1,v1=xyz" })).toBe(
      false,
    );
    const old = String(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    expect(
      verifyWebhookSignature({ ...base, header: header("123", "req-1", old) }),
    ).toBe(false);
  });

  it("aceita ts em segundos", () => {
    const seconds = String(Math.floor(now.getTime() / 1000));
    expect(
      verifyWebhookSignature({
        header: header("9", "r", seconds),
        requestId: "r",
        dataId: "9",
        secret,
        now,
      }),
    ).toBe(true);
  });

  it("lê o cabeçalho com espaços e em qualquer ordem", () => {
    const v1 = "a".repeat(64);
    expect(parseSignatureHeader(` v1=${v1} , ts=10`)).toEqual({ ts: "10", v1 });
  });
});
