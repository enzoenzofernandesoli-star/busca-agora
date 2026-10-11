# Design, Parte 2 — divisão de trabalho e prompts para o ChatGPT (G44 a G46)

Base: `docs/design/auditoria-design.md` (seções C "Sobre", "Contato", "Termos/Privacidade/Trocas" e "Admin"). Branch: `design-onda2`. Mesmo esquema: uma conversa por prompt, **só os arquivos listados**, nada instalado, sem commit nem push. Os 3 são independentes.

| Peça | Quem | Arquivos |
| --- | --- | --- |
| G44 Sobre com personalidade | ChatGPT | `app/(loja)/sobre/page.tsx` |
| G45 Contato acolhedor | ChatGPT | `app/(loja)/contato/page.tsx` |
| G46 Índice nas páginas legais | ChatGPT | `components/legal/legal-page.tsx`, `app/(loja)/termos/page.tsx`, `app/(loja)/privacidade/page.tsx`, `app/(loja)/trocas/page.tsx` |
| Admin no celular: avisos antes do gráfico, letras maiores | Claude Code | `app/admin/page.tsx`, `components/admin/*` |
| Revisão e integração | Claude Code | — |

Bloco de contexto: use o mesmo de `docs/design/onda1-prompts-chatgpt.md` (cole-o no início de cada prompt).

---

## G44 — Sobre com personalidade

```
[cole o bloco de contexto]

Arquivo: app/(loja)/sobre/page.tsx. Hoje usa <LegalPage> (visual de documento). Reescreva-o sem LegalPage, mantendo metadata, getStoreInfo() e <StoreIdentity info={info} /> (de "@/components/legal/legal-page"; continua no fim da página). NÃO invente fatos: use só o que já está escrito (loja online de eletrônicos e cosméticos; um único vendedor, a Busca Agora; negócio de família; cuidamos da escolha dos produtos, do atendimento e do envio; Pix aprovado na hora; despacho em até 24 h; troca em até 7 dias, com link para /trocas). Sem fotos de pessoas, sem números, sem depoimentos.

Layout (max-w 960 centralizado, gap 24, 40 no desktop):
1. Topo escuro: seção bg-noite text-white, raio 28, padding 24 (40 desktop), overflow-hidden relative. Dois círculos decorativos aria-hidden (como na Home: border branco 6% de opacidade, um grande cortado no canto superior direito, um contorno fino 12% no canto inferior esquerdo). Rótulo "SOBRE A BUSCA AGORA" 13px bold tracking .1em text-lavanda. h1 font-display extrabold 32px (44 desktop) leading 1.05: "Uma loja de família." + quebra + "Uma escolha de cada vez." com "Uma escolha de cada vez." em text-lima. Parágrafo 16 (18 desktop) text-lavanda max-w 560 com os dois parágrafos atuais juntos.
2. Duas placas lado a lado no desktop (uma coluna no celular), gap 16: Eletrônicos (bg-ciano-tile, ícone HeadphonesIcon 28 ciano-ink numa placa 56 bg-white raio 16) com título 20 bold "Eletrônicos" e texto "Fones, relógios, caixas de som e carregadores." e link "Ver eletrônicos" para /c/eletronicos (min-h 44, bold, noite, seta ArrowRightIcon 18); Cosméticos igual com bg-rosa-tile, BottleIcon rosa-ink, "Skincare, cabelo, corpo e proteção solar.", "Ver cosméticos" /c/cosmeticos. Raio 24, padding 24.
3. Faixa de 3 garantias (grid 3 colunas no desktop, 1 no celular, gap 12): cartão branco borda borda raio 22 padding 20, ícone 24 ultramar numa placa 44 bg-ultramar-50 raio 14, texto 16 bold noite. Itens: "Pix aprovado na hora", "Despacho em até 24 h", "Troca em até 7 dias" (este com link para /trocas). Use ícones de "@/components/loja/icons" (PixIcon, TruckIcon, ExchangeIcon).
4. Slogan: bloco bg-noite raio 22 padding 24, font-display extrabold 28 (36 desktop): "Buscou? " + "Tá aqui." em text-lima.
5. "Quem está por trás da loja": h2 font-display bold 20 e cartão branco borda raio 22 padding 20 (32 desktop) com <StoreIdentity info={info} />; texto 15 leading 1.6 (os <li> do StoreIdentity herdam).
Sem "Atualizado em" nesta página.

Entregue o arquivo completo.
```

---

## G45 — Contato acolhedor

```
[cole o bloco de contexto]

Arquivo: app/(loja)/contato/page.tsx. Reescreva sem <LegalPage>, mantendo metadata, getStoreInfo() e <StoreIdentity info={info} /> no fim. Os dados vêm de info (whatsapp, email, horario podem ser null). Quando um dado for null, NÃO mostre "[a preencher]": mostre o texto "Em breve" em texto-2 (e no WhatsApp, em vez do botão, "Em breve por aqui."). Não prometa tempo de resposta.

Layout (max-w 960 centralizado, gap 24):
1. Cabeçalho: placa 48 raio 14 bg-ultramar-50 com um ícone de balão de conversa de traço (desenhe no arquivo, estilo Lucide 24x24); h1 font-display extrabold 28 (34 desktop) "Fale com a Busca Agora"; parágrafo 16 texto-2 "Dúvida sobre produto, entrega ou pedido? Escolha um canal."
2. Grid de canais (2 colunas desktop, 1 celular, gap 16), cada um cartão branco borda borda raio 22 padding 24, ícone 24 numa placa 44 raio 14, título 18 bold, conteúdo 16:
   - WhatsApp (placa bg-lima, ícone noite): botão principal bg-ultramar text-white min-h 48 raio 14 "Chamar no WhatsApp" (link wa.me igual ao atual, com o mesmo texto pré-preenchido, target _blank, rel noopener noreferrer, sr-only "(abre em nova aba)").
   - E-mail (placa bg-ciano-tile, ícone ciano-ink): link mailto sublinhado ultramar, quebra de linha segura (break-all).
   - Horário (placa bg-rosa-tile, ícone rosa-ink): texto do horário.
   - Atalhos (placa bg-ultramar-50, ícone ultramar): 3 links min-h 44 com seta ArrowRightIcon: "Rastrear pedido" /rastreio, "Meus pedidos" /conta/pedidos, "Trocas e devoluções" /trocas.
3. "Dados da loja": h2 font-display bold 20 + cartão branco borda raio 22 padding 20 (32 desktop) com <StoreIdentity info={info} />.

Entregue o arquivo completo.
```

---

## G46 — Índice nas páginas legais

```
[cole o bloco de contexto]

1) components/legal/legal-page.tsx: acrescente ao LegalPage o prop opcional indice?: { id: string; label: string }[]. Quando houver, logo depois do cabeçalho (antes do aviso), mostre <nav aria-label="Nesta página"> num cartão bg-ultramar-50 raio 22 padding 16 (20 desktop) com o título "Nesta página" 15 bold noite e uma lista de links âncora (href={`#${id}`}) em 2 colunas no desktop e 1 no celular, cada link min-h 44, 15px, text-ultramar, sublinhado no hover/foco. Acrescente também scroll-mt-24 aos h2 do conteúdo ([&_h2]:scroll-mt-24 na div do conteúdo) para o título não ficar embaixo do topo ao pular. Não mude mais nada no arquivo (formatWhatsapp, A_PREENCHER, StoreIdentity continuam iguais).

2) app/(loja)/termos/page.tsx e app/(loja)/trocas/page.tsx: dê um id curto, minúsculo, sem acento (ex.: "pagamento", "entrega") a cada <h2> que ainda não tiver id (mantenha os ids que já existem, como id="entrega" em trocas). Não mude nenhum texto.

3) Nas três páginas (termos, privacidade, trocas), passe indice={[...]} ao <LegalPage> com um item por <h2>, na ordem, usando o id e o texto do próprio h2 como label.

Entregue os 4 arquivos completos.
```
