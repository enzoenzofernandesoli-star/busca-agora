"use client";

import { useState } from "react";

import { AddressForm } from "@/components/conta/address-form";
import type { Address } from "@/components/conta/address-card";
import type { FormState } from "@/lib/forms/state";

type AddressManagerProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  /** Edit an existing address; without it, the button adds a new one. */
  address?: Address;
  label: string;
  variant?: "principal" | "link";
};

// Opens the address form inline (add or edit) and closes it after saving.
export function AddressManager({
  action,
  address,
  label,
  variant = "principal",
}: AddressManagerProps) {
  const [aberto, setAberto] = useState(false);

  if (aberto) {
    return (
      <div className="w-full rounded-[22px] border border-borda bg-white p-5 md:p-8">
        <AddressForm
          action={action}
          address={address}
          onDone={() => setAberto(false)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAberto(true)}
      className={
        variant === "principal"
          ? "min-h-[52px] cursor-pointer self-start rounded-[14px] bg-ultramar px-6 font-display text-base font-bold text-white hover:bg-ultramar-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
          : "min-h-11 cursor-pointer px-2 text-[15px] font-bold text-ultramar hover:text-noite"
      }
    >
      {label}
    </button>
  );
}
