import { BannerForm } from "@/components/admin/banner-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteBanner } from "@/lib/admin/actions";
import { listBanners } from "@/lib/admin/queries";

export const metadata = { title: "Banners" };

export default async function AdminBanners() {
  const banners = await listBanners();
  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        Banners da home
      </h1>
      <p className="m-0 text-[15px] text-texto-2">
        Sem nenhum banner ativo, a home mostra o destaque padrão “Buscou? Tá
        aqui.”.
      </p>
      {banners.map((b) => (
        <section
          key={b.id}
          aria-label={b.titulo || "Banner"}
          className="flex flex-col gap-4 rounded-[22px] border border-borda bg-white p-5 md:p-7"
        >
          <BannerForm banner={b} />
          <div>
            <ConfirmDialog
              gatilho="Apagar banner"
              titulo="Apagar este banner?"
              texto="A imagem é removida da loja. Isso não pode ser desfeito."
              confirmarLabel="Apagar"
              perigo
              action={deleteBanner}
              campos={{ id: b.id }}
            />
          </div>
        </section>
      ))}
      <section
        aria-label="Novo banner"
        className="rounded-[22px] border border-dashed border-borda-forte bg-white p-5 md:p-7"
      >
        <h2 className="m-0 mb-4 font-display text-xl font-bold">Novo banner</h2>
        <BannerForm
          banner={{
            titulo: "",
            imagem_url: "",
            imagem_path: "",
            link: null,
            ordem: banners.length,
            ativo: true,
          }}
        />
      </section>
    </>
  );
}
