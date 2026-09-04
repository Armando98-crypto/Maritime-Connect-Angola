# Maritime Connect Angola

Plataforma que liga armadores/navios a agentes de navegação verificados
para contratação directa e transparente de agenciamento marítimo no
Porto do Namibe.

## Estado actual: Fatia 2 — Criar pedido (armador) ✅

### O que está pronto a usar
- Publicar pedido (`/pedidos/novo`): navio, data prevista de chegada,
  detalhes. Porto fixo "Namibe" na UI, sem campo na base de dados.
- Listar os meus pedidos (`/pedidos`), com estado vazio bem desenhado
  quando ainda não há nenhum, e contagem de propostas por pedido.
- Rotas `/pedidos*` protegidas por sessão + papel ARMADOR, quer na
  página (redirecciona para `/login` ou `/`), quer na API (`401`/`403`
  explícitos) — nunca só na UI.

### Casos limite já cobertos nesta fatia
- **Rascunho do formulário mais longo não se perde**: guardado em
  `localStorage` a cada alteração, recuperado ao reabrir a página, e
  limpo só depois de o pedido ser criado com sucesso.
- Falha de rede a meio da submissão: mensagem clara com "Tentar de
  novo", sem duplicar o pedido e sem perder o que foi escrito (fica no
  estado React e no localStorage).
- Data prevista de chegada no passado é rejeitada no cliente e no
  servidor (mesmo schema Zod); a data de hoje é aceite.
- Um agente (ou pedido não autenticado) a chamar `POST/GET /api/pedidos`
  directamente é bloqueado com `401`/`403`, não apenas escondido na UI.
- Pedido nasce sempre `ABERTO` — não há forma de o serviço criar um
  pedido já `ATRIBUIDO`/`CONCLUIDO` (coberto por teste).

### O que ficou de fora de propósito (fora do âmbito desta fatia)
- Cancelar um pedido — decidido deixar para quando a fatia 4
  (aceitar/gerir propostas) também precisar dessa lógica de transição
  de estado, para não duplicar trabalho.
- Ver o quadro de pedidos abertos do lado do agente — fatia 3.
- Editar um pedido depois de publicado — não estava no fluxo pedido;
  digam se quiserem, mas implica decidir se agentes já com proposta
  enviada devem ser notificados.

## Fatia 1 — Autenticação + Registo ✅

### O que está pronto a usar
- Registo de conta como **Armador** ou **Agente de navegação**
  (`/registo`). Agentes indicam empresa e número de licença; ficam
  automaticamente `licencaVerificada = false` até verificação manual.
- Login (`/login`) com sessão via NextAuth (credenciais + JWT).
- Homepage (`/`) mostra ecrã diferente consoante haja ou não sessão
  activa, com botão de sair.
- Validação de formulário no **cliente e no servidor**, com o mesmo
  schema Zod (`src/lib/validacoes/auth.ts`).
- Palavras-passe nunca guardadas em texto simples (bcrypt, 12 rounds).

### Casos limite já cobertos nesta fatia
- **Corrida de duas submissões quase simultâneas com o mesmo email**:
  a segunda falha com mensagem clara (`EmailJaExisteError`), nunca com
  erro 500 genérico nem com dois utilizadores duplicados na BD —
  garantido pela constraint `UNIQUE` na base de dados, com tradução do
  erro Prisma `P2002` para um erro de domínio.
- Mesmo caso para número de licença duplicado entre agentes.
- Registo de agente é atómico: se a criação do `PerfilAgente` falhar
  depois do `User` já ter sido criado, a transacção inteira reverte —
  nunca fica um agente "pela metade" na base de dados.
- Falha de rede a meio do registo/login: a mensagem de erro tem sempre
  botão de "Tentar de novo" e os dados escritos no formulário não se
  perdem (ficam em estado React, não são limpos em caso de erro).
- Erros de validação do servidor (não só do cliente) devolvidos com
  detalhe por campo — a UI nunca confia cegamente na validação local.

### O que ficou de fora de propósito (fora do âmbito desta fatia)
- Recuperação de palavra-passe — não fazia parte do fluxo operacional
  pedido; posso adicionar se quiseres, mas implica email transaccional
  (SMTP), que é uma peça nova a decidir.
- Painel de administração para verificar licenças — combinado que isto
  é feito por acesso directo à base de dados (`isAdmin` / `UPDATE`
  manual) nesta fase.

## ⚠️ Nota importante sobre o ambiente onde isto foi construído

Este projecto foi desenvolvido num sandbox com acesso de rede restrito
a alguns domínios (npm, GitHub, PyPI). O domínio `binaries.prisma.sh` —
de onde o comando `prisma generate` descarrega o motor (query engine)
— **não estava acessível**. Por isso, nesse ambiente:

- Não foi possível correr `prisma generate` nem `prisma migrate`.
- A verificação de tipos (`tsc --noEmit`) mostra erros nos ficheiros
  que importam de `@prisma/client` (`PrismaClient`, `Prisma`, `User`)
  — **não são bugs no código**, são consequência directa de o cliente
  Prisma ainda não ter sido gerado nesse ambiente.
- Para não bloquear os testes de lógica de negócio nessa mesma
  limitação, os testes mockam `@prisma/client` e `@/lib/prisma`
  directamente (o que é aliás boa prática — testes unitários não
  devem depender de um motor de base de dados real).

**Na tua máquina, com acesso normal à internet, isto não é um
problema**: corre os passos abaixo normalmente e tudo deve funcionar.
Se por algum motivo o teu ambiente também bloquear `binaries.prisma.sh`,
diz-me e ajudo a configurar os "driver adapters" do Prisma (modo sem
motor binário, usando `@prisma/adapter-pg` directamente) — é mais
trabalho de configuração, mas evita a dependência desse download.

## Como arrancar

```bash
npm install

cp .env.example .env
# edita .env com a tua DATABASE_URL real e um AUTH_SECRET gerado com:
# openssl rand -base64 32

npx prisma generate
npx prisma migrate dev --name inicial

npm run dev
```

Abre http://localhost:3000

## Testes

```bash
npm run test        # corre uma vez
npm run test:watch  # modo watch
npm run typecheck   # verificação de tipos
```

## Stack

Next.js 14+ (App Router) · TypeScript estrito · PostgreSQL + Prisma ·
NextAuth (credenciais) · Tailwind CSS · Zod · Vitest
