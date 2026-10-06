# Fase 3 — prompts para o ChatGPT (G6 a G10)

Mesmo esquema da fase 2: uma conversa por prompt (GPT-6 Sol). Ele **só cria os arquivos listados no prompt**, não mexe em nenhum outro, não faz commit nem push. Depois te passa o resumo do que fez e você me manda.

Bloco de contexto (já incluído em cada prompt):

> Projeto: loja virtual Busca Agora. Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, zod 4. Sem "any", sem console.log, sem biblioteca nova. Textos da interface em português do Brasil; nomes de código e comentários em inglês. Ícones: SVG de traço (estilo Lucide), nunca emoji. Importações com o alias "@/". Classes de cor do Tailwind já existentes: ultramar (#3324F5), ultramar-700 (#2416D6), ultramar-50 (#ECEBFF), noite (#0A0F3D), lima (#C6FF3D), fundo (#F4F5FA), borda (#E3E5F2), borda-forte (#D5D8EA), texto-2 (#4A4F70), texto-3 (#6B7094), rosa-ink (#B0306E), estoque (#1F7A3A). Fontes: font-display (Sora), font-sans (DM Sans). Alvos de toque com no mínimo 44 px, foco visível (outline-3 outline-offset-2 outline-ultramar), labels de verdade em todo campo.

---

## G6 — CPF

```
[cole o bloco de contexto]

Tarefa: crie lib/br/cpf.ts e tests/unit/cpf.test.ts (Vitest 4: import { describe, expect, it } from "vitest").

lib/br/cpf.ts exporta funções puras:
- onlyDigits(value: string): string
- isValidCpf(value: string): boolean — aceita com ou sem máscara; exige 11 dígitos; recusa sequências repetidas (000.000.000-00, 111...); confere os 2 dígitos verificadores pelo algoritmo oficial.
- formatCpf(value: string): string — máscara progressiva enquanto digita: "123" -> "123", "1234" -> "123.4", "12345678901" -> "123.456.789-01"; ignora o que passar de 11 dígitos.
- cpfSchema: schema zod que recebe string, normaliza para só dígitos e falha com a mensagem "CPF inválido" se isValidCpf for falso. Saída: os 11 dígitos.

Testes: CPFs válidos de exemplo gerados pelo algoritmo (NUNCA use CPF de pessoa real; use, por exemplo, 529.982.247-25 e 111.444.777-35, que são exemplos públicos de documentação), inválidos por dígito, por tamanho, sequência repetida, com letras; formatCpf progressivo; cpfSchema devolve só dígitos.

Entregue só os 2 arquivos completos.
```

---

## G7 — CEP, telefone e ViaCEP

```
[cole o bloco de contexto]

Tarefa: crie lib/br/cep.ts, lib/br/telefone.ts, tests/unit/cep.test.ts e tests/unit/telefone.test.ts.

lib/br/cep.ts:
- formatCep(value): máscara progressiva "01001000" -> "01001-000".
- cepSchema (zod): string -> 8 dígitos, mensagem "CEP inválido".
- type ViaCepAddress = { cep: string; rua: string; bairro: string; cidade: string; uf: string }
- async function lookupCep(cep: string, fetchImpl: typeof fetch = fetch): Promise<ViaCepAddress | null>
  - Chama https://viacep.com.br/ws/{8 dígitos}/json/ com timeout de 4 s (AbortSignal.timeout(4000)).
  - Valida a resposta com zod. O ViaCEP devolve { erro: true } (ou "true") para CEP inexistente: retorne null. Campos do ViaCEP: logradouro -> rua, bairro, localidade -> cidade, uf.
  - CEP inválido, erro de rede, timeout ou resposta fora do formato: retorne null (nunca lance).
  - uf sempre em maiúsculas com 2 letras.

lib/br/telefone.ts:
- formatTelefone(value): máscara progressiva para fixo "(11) 3333-4444" e celular "(11) 98888-7777".
- telefoneSchema (zod): 10 ou 11 dígitos, DDD de 11 a 99, celular (11 dígitos) começa com 9; saída só dígitos; mensagem "Telefone inválido".

Testes: máscaras progressivas, schemas, e lookupCep com fetch falso (passe fetchImpl): sucesso, { erro: true }, { erro: "true" }, resposta 500, JSON quebrado, timeout simulado (fetch que rejeita com AbortError). Nenhum teste pode chamar a internet.

Entregue só os 4 arquivos completos.
```

---

## G8 — Campos e formulário de login/cadastro

```
[cole o bloco de contexto]

Tarefa: crie 4 arquivos. Nada de chamada ao Supabase: a lógica fica numa Server Action que o projeto passa por prop.

1) lib/forms/state.ts
export type FormState = { ok: boolean; message?: string; fieldErrors?: Partial<Record<string, string[]>> };
export const initialFormState: FormState = { ok: false };

2) components/conta/field.tsx (Server Component) — export function Field
Props: { id: string; name: string; label: string; type?: string; autoComplete?: string; inputMode?: "text" | "numeric" | "tel" | "email"; placeholder?: string; defaultValue?: string; required?: boolean; maxLength?: number; errors?: string[]; hint?: string }
- Label DM Sans 15px bold acima. Input altura 48px, cantos 14px, borda 1.5px borda-forte, fundo branco, texto 16px noite, placeholder texto-3, foco com outline ultramar.
- Com errors: borda rosa-ink, aria-invalid="true", aria-describedby apontando para a mensagem (id `${id}-erro`), mensagem 14px rosa-ink abaixo. hint em 14px texto-2 com id `${id}-dica`.

3) components/conta/password-field.tsx ("use client") — export function PasswordField
Mesmas props do Field (sem type) + showStrength?: boolean.
- Botão de traço (olho / olho riscado) dentro do campo à direita, 44x44, aria-label "Mostrar senha" / "Ocultar senha", aria-pressed.
- showStrength: barra de 4 segmentos e texto ("Fraca", "Média", "Boa", "Forte") por regras simples: tamanho ≥ 8, letra maiúscula e minúscula, número, símbolo. Texto com aria-live="polite". Cores: rosa-ink (fraca), #B7791F (média), ultramar (boa), estoque (forte).

4) components/conta/auth-form.tsx ("use client") — export function AuthForm
Props: { action: (state: FormState, formData: FormData) => Promise<FormState>; submitLabel: string; children: React.ReactNode; footer?: React.ReactNode }
- Usa useActionState(action, initialFormState) do React 19 e useFormStatus num botão interno.
- Mostra state.message no topo num aviso (role="alert"): fundo #FFF0F7 com texto rosa-ink se !ok; fundo #ECFDF3 com texto estoque se ok.
- Repassa state.fieldErrors para os filhos via um React Context exportado (export function useFieldErrors(name: string): string[] | undefined) para Field/PasswordField lerem quando errors não vier por prop.
- Botão submit: largura total, altura 56px, cantos 16px, fundo ultramar, texto branco Sora 700 17px, hover ultramar-700; desabilitado e com texto "Aguarde..." enquanto pending.
- noValidate no form (a validação de verdade é no servidor), mas mantenha required/type nos campos.

Entregue só os 4 arquivos completos.
```

---

## G9 — Endereços

```
[cole o bloco de contexto]

Já existem no projeto (não recrie): lib/forms/state.ts (FormState), components/conta/field.tsx (Field), components/conta/auth-form.tsx (useFieldErrors), lib/br/cep.ts (formatCep, ViaCepAddress).

Tarefa: crie 2 arquivos.

1) components/conta/address-form.tsx ("use client") — export function AddressForm
Props: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  address?: { id: string; cep: string; rua: string; numero: string; complemento: string | null; bairro: string; cidade: string; uf: string; principal: boolean };
  onDone?: () => void;
}
- Campos (todos com label): CEP (máscara com formatCep, inputMode numeric), Rua, Número, Complemento (opcional), Bairro, Cidade, UF (select com as 27 siglas), checkbox "Usar como endereço principal". Campo hidden "id" quando editar.
- Ao completar 8 dígitos no CEP: GET /api/cep/{8 dígitos} (essa rota o projeto cria; resposta { endereco: ViaCepAddress | null }). Se vier endereço, preenche rua, bairro, cidade e uf (sem apagar o que o cliente já digitou em número/complemento) e move o foco para "Número". Se vier null: mensagem "CEP não encontrado. Preencha o endereço." Mostra "Buscando CEP..." com aria-live enquanto busca. Cancela a busca anterior se o CEP mudar (AbortController).
- Layout: grid de 1 coluna no celular; no md, CEP + Número lado a lado, Rua inteira, Bairro + Cidade + UF.
- Usa useActionState(action, initialFormState); ao receber state.ok === true chama onDone.
- Botões: "Salvar endereço" (principal, ultramar, 52px) e "Cancelar" (contorno, chama onDone).

2) components/conta/address-card.tsx (Server Component) — export function AddressCard
Props: { address: (o mesmo tipo acima); actions?: React.ReactNode }
- Card branco, borda 1px borda, cantos 22px, padding 20px. Selo "Principal" (fundo lima, texto noite, 12px bold, cantos 999px) quando principal.
- Linhas: "Rua, número - complemento", "Bairro · Cidade/UF", "CEP 00000-000".
- Área `actions` à direita (desktop) ou embaixo (celular) para os botões que o projeto passa.

Entregue só os 2 arquivos completos.
```

---

## G10 — Menu da conta e exclusão

```
[cole o bloco de contexto]

Tarefa: crie 2 arquivos.

1) components/conta/account-nav.tsx ("use client") — export function AccountNav
Props: { nome: string }
- Itens: "Meus dados" (/conta), "Endereços" (/conta/enderecos), "Pedidos" (/conta/pedidos), "Sair" (este é um <form action="/auth/sair" method="post"> com botão, não link).
- Destaca o item atual com usePathname (fundo ultramar-50, texto ultramar, aria-current="page").
- Desktop (md+): card lateral branco 260px, borda borda, cantos 22px, "Olá, {primeiro nome}" no topo em Sora 700 18px.
- Celular: lista horizontal rolável de chips (altura 44px, cantos 999px), sem o "Olá".
- Ícones de traço 20px antes de cada item (usuário, alfinete de mapa, caixa, sair).

2) components/conta/delete-account-dialog.tsx ("use client") — export function DeleteAccountDialog
Props: { action: (state: FormState, formData: FormData) => Promise<FormState> } (FormState de "@/lib/forms/state")
- Botão "Excluir minha conta" (texto rosa-ink, contorno rosa-ink, 48px) abre um <dialog> nativo (showModal), fecha com Esc e com "Cancelar".
- Texto do diálogo: título "Excluir sua conta?" e "Seus dados pessoais, endereços e carrinho serão apagados. Os pedidos já feitos ficam guardados só com os dados exigidos pela nota fiscal, pelo prazo da lei. Isso não pode ser desfeito."
- Campo "Digite EXCLUIR para confirmar" (name="confirmacao"); o botão "Excluir conta" (fundo rosa-ink, texto branco) só habilita quando o texto for exatamente EXCLUIR.
- Usa useActionState; mostra state.message em role="alert" se der erro.
- Foco vai para o campo ao abrir e volta para o botão que abriu ao fechar.

Entregue só os 2 arquivos completos.
```
