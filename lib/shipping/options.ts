import type { ShippingOption } from "@/lib/shipping/types";

const MAX_OPTIONS = 4;

/**
 * "Jadlog · Package" instead of the provider's bare ".Package": service
 * names alone repeat across carriers ("Standard") and confuse customers.
 */
export function withCarrierName(option: ShippingOption): ShippingOption {
  const service = option.servico.replace(/^[\s.]+/, "").trim();
  const carrier = option.transportadora.trim();
  const servico =
    !carrier || service.toLowerCase().startsWith(carrier.toLowerCase())
      ? service || carrier
      : `${carrier} · ${service}`;
  return { ...option, servico };
}

function byPrice(a: ShippingOption, b: ShippingOption) {
  return a.precoCents - b.precoCents || a.prazoDias - b.prazoDias;
}

/**
 * Keeps at most 4 options: the cheapest, the fastest, the cheapest Correios
 * (customers trust it) and the next cheapest. Deterministic, so the same
 * quote always shows the same list. Sorted by price.
 */
export function pickOptions(options: ShippingOption[]): ShippingOption[] {
  const sorted = [...options].sort(byPrice);
  const picked = new Map<string, ShippingOption>();
  const add = (option: ShippingOption | undefined) => {
    if (option && picked.size < MAX_OPTIONS)
      picked.set(option.servicoId, option);
  };
  add(sorted[0]);
  add(
    [...sorted].sort(
      (a, b) => a.prazoDias - b.prazoDias || a.precoCents - b.precoCents,
    )[0],
  );
  add(sorted.find((o) => /correios/i.test(o.transportadora)));
  for (const option of sorted) {
    if (picked.size >= MAX_OPTIONS) break;
    add(option);
  }
  return [...picked.values()].sort(byPrice).map(withCarrierName);
}
