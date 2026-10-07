import { AuthForm } from "@/components/conta/auth-form";
import { Field } from "@/components/conta/field";
import { saveSettings } from "@/lib/admin/actions";
import { getIntegrationStatus, getSettings } from "@/lib/admin/queries";

export const metadata = { title: "Configurações" };

const card =
  "flex flex-col gap-5 rounded-[22px] border border-borda bg-white p-5 md:p-8";

const ESTADO = {
  conectado: { texto: "Conectado", cor: "bg-[#ECFDF3] text-estoque" },
  erro: { texto: "Com erro", cor: "bg-rosa-tile text-rosa-ink" },
  nao_configurado: { texto: "Não configurado", cor: "bg-fundo text-texto-2" },
  desligado: { texto: "Desligado", cor: "bg-fundo text-texto-2" },
} as const;

export default async function AdminConfiguracoes() {
  const [s, integracoes] = await Promise.all([
    getSettings(),
    getIntegrationStatus(),
  ]);
  const o = s.origem;

  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        Configurações
      </h1>

      <section className={card} aria-labelledby="empresa">
        <h2 id="empresa" className="m-0 font-display text-xl font-bold">
          Dados da loja e endereço de envio
        </h2>
        <AuthForm action={saveSettings} submitLabel="Salvar configurações">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="razao_social"
              name="razao_social"
              label="Nome ou razão social"
              defaultValue={s.razao_social ?? ""}
            />
            <Field
              id="documento"
              name="documento"
              label="CNPJ (vendendo no CPF, deixe em branco)"
              inputMode="numeric"
              defaultValue={s.cnpj ?? ""}
            />
            <Field
              id="ie"
              name="ie"
              label="Inscrição estadual (opcional)"
              defaultValue={s.ie ?? ""}
            />
            <Field
              id="regime_tributario"
              name="regime_tributario"
              label="Regime tributário (opcional)"
              defaultValue={s.regime_tributario ?? ""}
              placeholder="Simples Nacional, MEI..."
            />
          </div>
          <h3 className="m-0 font-display text-lg font-bold">
            Endereço de onde os pacotes saem
          </h3>
          <p className="m-0 text-sm text-texto-2">
            Usado no cálculo do frete e como remetente na etiqueta.
          </p>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <Field
                id="cep"
                name="cep"
                label="CEP"
                inputMode="numeric"
                defaultValue={o.cep ?? ""}
                required
              />
            </div>
            <div className="md:col-span-4">
              <Field
                id="rua"
                name="rua"
                label="Rua"
                defaultValue={o.rua ?? ""}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Field
                id="numero"
                name="numero"
                label="Número"
                defaultValue={o.numero ?? ""}
                required
              />
            </div>
            <div className="md:col-span-4">
              <Field
                id="complemento"
                name="complemento"
                label="Complemento"
                defaultValue={o.complemento ?? ""}
              />
            </div>
            <div className="md:col-span-2">
              <Field
                id="bairro"
                name="bairro"
                label="Bairro"
                defaultValue={o.bairro ?? ""}
                required
              />
            </div>
            <div className="md:col-span-3">
              <Field
                id="cidade"
                name="cidade"
                label="Cidade"
                defaultValue={o.cidade ?? ""}
                required
              />
            </div>
            <div className="md:col-span-1">
              <Field
                id="uf"
                name="uf"
                label="UF"
                defaultValue={o.uf ?? ""}
                required
                maxLength={2}
              />
            </div>
          </div>
          <Field
            id="printer_id"
            name="printer_id"
            label="Impressora (ID no PrintNode)"
            inputMode="numeric"
            defaultValue={s.printer_id ?? ""}
            hint="Aparece no painel do PrintNode depois de instalar o programa no computador da impressora."
          />
        </AuthForm>
      </section>

      <section className={card} aria-labelledby="integracoes">
        <h2 id="integracoes" className="m-0 font-display text-xl font-bold">
          Integrações
        </h2>
        <p className="m-0 text-sm text-texto-2">
          Só mostra se está ligada e respondendo. As chaves ficam na Vercel e
          nunca aparecem aqui.
        </p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {integracoes.map((i) => (
            <li
              key={i.nome}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-borda pb-3 last:border-0"
            >
              <span>
                <b>{i.nome}</b>
                <span className="block text-sm text-texto-2">{i.detalhe}</span>
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${ESTADO[i.estado].cor}`}
              >
                {ESTADO[i.estado].texto}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
