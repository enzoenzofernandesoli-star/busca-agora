"use client";

import { useState } from "react";

import {
  ImageUploader,
  type AdminImage,
} from "@/components/admin/image-uploader";
import { AuthForm } from "@/components/conta/auth-form";
import { Field } from "@/components/conta/field";
import { requestImageUpload, saveBanner } from "@/lib/admin/actions";

type Banner = {
  id?: string;
  titulo: string;
  imagem_url: string;
  imagem_path: string;
  link: string | null;
  ordem: number;
  ativo: boolean;
};

export function BannerForm({ banner }: { banner: Banner }) {
  const key = banner.id ?? "novo";
  // Image state lives above the form, so a validation error (which remounts
  // the form) keeps the uploaded image.
  const [imagens, setImagens] = useState<AdminImage[]>(
    banner.imagem_url
      ? [
          {
            url: banner.imagem_url,
            path: banner.imagem_path,
            alt: banner.titulo,
          },
        ]
      : [],
  );
  const imagem = imagens[0];

  return (
    <AuthForm
      action={saveBanner}
      submitLabel={banner.id ? "Salvar banner" : "Criar banner"}
    >
      {banner.id ? <input type="hidden" name="id" value={banner.id} /> : null}
      <input type="hidden" name="imagemUrl" value={imagem?.url ?? ""} />
      <ImageUploader
        value={imagens}
        onChange={setImagens}
        requestUpload={requestImageUpload}
        max={1}
        nomeProduto={banner.titulo || "Banner"}
      />
      <p className="m-0 text-sm text-texto-2">
        Imagem larga (1600 × 640), sem texto escrito nela: o título aparece por
        cima.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          id={`${key}-titulo`}
          name="titulo"
          label="Título (opcional)"
          defaultValue={banner.titulo}
        />
        <Field
          id={`${key}-link`}
          name="link"
          label="Link ao clicar (opcional)"
          defaultValue={banner.link ?? ""}
          placeholder="/c/eletronicos"
        />
        <Field
          id={`${key}-ordem`}
          name="ordem"
          label="Ordem"
          inputMode="numeric"
          defaultValue={String(banner.ordem)}
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-bold">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={banner.ativo}
          className="size-5 accent-ultramar"
        />
        Aparece na home
      </label>
    </AuthForm>
  );
}
