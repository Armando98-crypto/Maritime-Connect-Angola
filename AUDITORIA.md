# Auditoria e correcções — Setembro 2026

Este documento regista os bugs encontrados numa auditoria de segurança/
correcção ao código que tinha sido gerado (fora do processo normal de
fatias) numa sessão anterior, e as correcções aplicadas a cada um.

## 🔴 Crítico — corrigido

### 1. Corrida de concorrência: aceitar proposta vs. cancelar pedido

**O problema**: `aceitarProposta`, `cancelarPedido` e `criarProposta`
liam o estado do pedido, validavam em JavaScript, e só depois escreviam
— sem reconfirmar a condição no momento exacto da escrita. Duas
operações concorrentes sobre o mesmo pedido (ex.: aceitar uma proposta
ao mesmo tempo que se cancela o pedido, em duas abas) podiam produzir um
estado corrompido: um pedido cancelado podia ser "ressuscitado" para
`ATRIBUIDO`.

**A correcção**: todas as transições de estado (`aceitarProposta`,
`recusarProposta`, `cancelarPedido`, `concluirPedido`,
`confirmarPagamentoComissao`) passaram a usar **escrita condicional
atómica** — `prisma.<modelo>.updateMany({ where: { id, estado: "X" },
data: {...} })` — dentro de transacções interactive quando há mais do
que um passo. O Postgres serializa escritas concorrentes na mesma
linha; se `count === 0`, sabemos sem ambiguidade que outra operação
ganhou a corrida, e lançamos o erro de domínio correcto em vez de
prosseguir sobre dados desactualizados.

Ficheiros alterados: `src/servicos/propostaServico.ts`,
`src/servicos/pedidoServico.ts`, `src/servicos/adminServico.ts`.

Testado em: `tests/servicos/propostaServico.test.ts`,
`tests/servicos/propostaArmadorServico.test.ts`,
`tests/servicos/pedidoServico.test.ts`,
`tests/servicos/concluirPedidoServico.test.ts`,
`tests/servicos/adminServico.test.ts` (procurar por "corrida" nesses
ficheiros).

### 2. Agentes com licença não verificada podiam enviar propostas

**O problema**: o campo `licencaVerificada` só era mostrado na UI
(perfil, painel de admin); nunca era verificado antes de aceitar uma
proposta.

**A correcção**: `criarProposta` verifica `licencaVerificada` antes de
tudo, lançando `LicencaNaoVerificadaError` (bloqueado com explicação,
nunca em silêncio). A página `/agente/pedidos/[id]/proposta` também
esconde o formulário e mostra um aviso claro em vez de deixar o agente
preencher tudo para ser recusado no fim.

Ficheiros alterados: `src/servicos/propostaServico.ts`,
`src/app/api/propostas/route.ts`,
`src/app/agente/pedidos/[id]/proposta/page.tsx`.

## 🟠 Alto — corrigido

### 3. Cálculo da comissão em aritmética float

**O problema**: `calcularValorComissao` convertia o valor (um `Decimal`
do Prisma) para `Number` antes de calcular a percentagem — reintroduz
o erro de arredondamento de IEEE-754 que o uso de `Decimal` na base de
dados existe precisamente para evitar.

**A correcção**: passou a usar `decimal.js` do início ao fim, sem
nunca converter para `number`. Ver `tests/servicos/comissaoServico.ts`,
teste "não perde precisão em valores onde a aritmética float falharia".

### 4. Falha ao criar notificação derrubava operações já bem-sucedidas

**O problema**: `criarNotificacao()` não tinha tratamento de erro
próprio; se falhasse, a excepção subia e fazia a API devolver erro 500
sobre uma operação (aceitar proposta, cancelar pedido, etc.) que já
tinha sido gravada com sucesso na base de dados.

**A correcção**: todas as chamadas a `criarNotificacao` fora de uma
transacção passaram a "best effort" — envolvidas em `try/catch`, com o
erro apenas registado em log (`console.error`), nunca propagado.

## 🟡 Médio — corrigido

### 5. Upload de comprovativo confiava só no `Content-Type` do browser

Adicionada verificação da assinatura real dos bytes do ficheiro (magic
bytes) para PDF/PNG/JPEG/WebP, em `comissaoServico.ts`
(`assinaturaCorresponde`). Um ficheiro cujos bytes não correspondem ao
tipo declarado é agora rejeitado com `ComprovativoInvalidoError`.

### 6. Falta de constraint ao nível da base de dados para propostas duplicadas

Adicionada `@@unique([pedidoId, agenteId])` ao modelo `Proposta` no
schema Prisma — a duplicação deixa de depender só de uma verificação
prévia em JavaScript (que também tinha uma janela de corrida).

**⚠️ Acção necessária**: esta mudança de schema precisa de uma nova
migração. Corre `npx prisma migrate dev --name proposta_unica_por_agente`
depois de actualizar o teu ambiente com estes ficheiros.

### 7. `AvaliacaoDuplicadaError` não apanhava a corrida de duplo-clique

A constraint `UNIQUE(pedidoId)` em `Avaliacao` já protegia os dados,
mas uma violação dava um erro 500 genérico em vez de mensagem clara.
Corrigido com tradução do erro `P2002` do Prisma.

## 🟢 Baixo — corrigido

### 8. `layout.tsx` usava `LayoutProps<"/">`

Este tipo só existe depois de `next dev`/`build` já ter corrido pelo
menos uma vez (gerado automaticamente pelo Next). Substituído por
`{ children }: { children: ReactNode }`, portável e sem essa
dependência.

## Não alterado nesta auditoria

- **Âmbito alargado** (painel `/admin`, dashboards, notificações,
  upload de comprovativo) — o utilizador optou por manter e corrigir em
  vez de reduzir ao âmbito original combinado. Ver a conversa para o
  contexto completo desta decisão.
- **Armazenamento de ficheiros binários directamente no Postgres**
  (`comprovativoDados Bytes`) — funciona, mas não escala tão bem como
  armazenamento de objectos (S3/Supabase Storage). Não foi alterado
  porque implica infra-estrutura nova (credenciais de um serviço de
  armazenamento), fora do que foi pedido nesta auditoria.

## Como validar

```bash
npm install
npx prisma generate
npx prisma migrate dev --name proposta_unica_por_agente
npm run typecheck   # deve correr limpo (sem os erros de "Prisma sem gerar")
npm run lint        # deve correr sem erros nem avisos
npm run test        # 113 testes, todos a passar
```
