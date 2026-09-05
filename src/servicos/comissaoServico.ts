import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";

/**
 * Percentagem fixa (em %) que a plataforma cobra ao agente sobre o
 * valor da proposta aceite. Definida aqui, centralizada, para ser fácil
 * de ajustar sem tocar em várias partes do código.
 */
export const PERCENTAGEM_COMISSAO = 10;

/**
 * Tamanho máximo aceite para o comprovativo de pagamento (5 MB).
 */
export const TAMANHO_MAXIMO_COMPROVATIVO = 5 * 1024 * 1024;

/**
 * Tipos de ficheiro aceites como comprovativo de pagamento (PDF e
 * imagens), a usar na API antes de gravar os bytes na base de dados.
 */
export const TIPOS_COMPROVATIVO_PERMITIDOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

/**
 * O agente tentou aceder a uma comissão que não lhe pertence.
 */
export class SemPermissaoComissaoError extends Error {
  constructor() {
    super("Não tem permissão para aceder a esta comissão.");
    this.name = "SemPermissaoComissaoError";
  }
}

/**
 * A comissão (ou o pedido associado) não existe.
 */
export class ComissaoNaoEncontradaError extends Error {
  constructor() {
    super("A comissão não foi encontrada.");
    this.name = "ComissaoNaoEncontradaError";
  }
}

/**
 * A comissão já foi marcada como paga — não pode ser alterada.
 */
export class ComissaoJaPagaError extends Error {
  constructor() {
    super("Esta comissão já foi paga.");
    this.name = "ComissaoJaPagaError";
  }
}

/**
 * A confirmação de pagamento exige um comprovativo anexado pelo agente.
 */
export class ComissaoSemComprovativoError extends Error {
  constructor() {
    super(
      "Esta comissão ainda não tem comprovativo anexado. O agente deve enviar o comprovativo de pagamento antes de poder ser confirmada."
    );
    this.name = "ComissaoSemComprovativoError";
  }
}

/**
 * Calcula o valor da comissão a partir do valor base e da percentagem
 * fixa da plataforma.
 *
 * Usa Decimal (decimal.js) do início ao fim — nunca `number` — porque
 * `preco`/`valorComissao` são dinheiro. Uma conversão para float
 * introduziria o mesmo tipo de erro de arredondamento que o schema já
 * evita ao usar `Decimal` na base de dados (ex.: 19.99 * 10 / 100 dá,
 * em aritmética IEEE-754, 1.9990000000000003 em vez de exactamente
 * 1.999). Aceita qualquer valor que o Decimal.js entenda (Decimal,
 * string ou number), incluindo instâncias `Prisma.Decimal` devolvidas
 * pelo Prisma Client — são compatíveis com decimal.js.
 */
export function calcularValorComissao(valorBase: Decimal.Value): Decimal {
  return new Decimal(valorBase)
    .mul(PERCENTAGEM_COMISSAO)
    .div(100)
    .toDecimalPlaces(2);
}

/**
 * Lista as comissões de um agente (dos pedidos onde foi o escolhido),
 * mais recentes primeiro, com o navio do pedido. O agente usa isto para
 * ver quanto deve (PENDENTE) e o histórico do que já está pago (PAGA).
 */
export async function listarComissoesDoAgente(agenteId: string) {
  const pedidos = await prisma.pedido.findMany({
    where: { propostaAceite: { agenteId } },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      navio: true,
      comissao: true,
    },
  });

  return pedidos
    .filter((p) => p.comissao)
    .map((p) => ({ ...p.comissao!, navio: p.navio }));
}

/**
 * Resolve o agente dono de uma comissão a partir do pedido: o agente é
 * o da proposta aceite. Devolve o id do agente ou `null` se não houver.
 */
async function obterAgenteDaComissao(pedidoId: string): Promise<string | null> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      propostaAceite: {
        select: { agenteId: true },
      },
    },
  });
  return pedido?.propostaAceite?.agenteId ?? null;
}

/**
 * Confirma a assinatura real dos primeiros bytes do ficheiro (os
 * chamados "magic bytes"), em vez de confiar apenas no `Content-Type`
 * que o browser envia — esse campo é trivialmente falsificável (basta
 * mudar o cabeçalho do pedido), por isso não chega para decidir se um
 * ficheiro é mesmo um PDF/PNG/JPEG/WebP.
 */
function assinaturaCorresponde(tipoDeclarado: string, dados: Buffer): boolean {
  if (dados.length < 12) return false;

  switch (tipoDeclarado) {
    case "application/pdf":
      return dados.subarray(0, 4).toString("latin1") === "%PDF";
    case "image/png":
      return dados
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/jpeg":
      return (
        dados[0] === 0xff && dados[1] === 0xd8 && dados[2] === 0xff
      );
    case "image/webp":
      return (
        dados.subarray(0, 4).toString("latin1") === "RIFF" &&
        dados.subarray(8, 12).toString("latin1") === "WEBP"
      );
    default:
      return false;
  }
}

/**
 * O ficheiro enviado não corresponde ao tipo declarado (a assinatura
 * dos bytes não bate certo) — pode ser um tipo de ficheiro disfarçado.
 */
export class ComprovativoInvalidoError extends Error {
  constructor() {
    super(
      "O ficheiro enviado não parece ser um PDF, PNG, JPEG ou WebP válido."
    );
    this.name = "ComprovativoInvalidoError";
  }
}

/**
 * Anexa o comprovativo de pagamento a uma comissão PENDENTE. Só o agente
 * dono da comissão (o da proposta aceite do pedido) o pode fazer. Enquanto
 * a comissão estiver PENDENTE, o comprovativo pode ser substituído.
 */
export async function anexarComprovativo(
  comissaoId: string,
  agenteId: string,
  comprovativo: {
    nome: string;
    tipo: string;
    tamanho: number;
    dados: Buffer;
  }
) {
  if (!assinaturaCorresponde(comprovativo.tipo, comprovativo.dados)) {
    throw new ComprovativoInvalidoError();
  }

  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: {
      id: true,
      pedidoId: true,
      estado: true,
    },
  });

  if (!comissao) {
    throw new ComissaoNaoEncontradaError();
  }

  const dono = await obterAgenteDaComissao(comissao.pedidoId);
  if (dono !== agenteId) {
    throw new SemPermissaoComissaoError();
  }

  if (comissao.estado !== "PENDENTE") {
    throw new ComissaoJaPagaError();
  }

  const bytes = new Uint8Array(comprovativo.dados.byteLength);
  bytes.set(comprovativo.dados);

  return prisma.comissao.update({
    where: { id: comissao.id },
    data: {
      comprovativoNome: comprovativo.nome,
      comprovativoTipo: comprovativo.tipo,
      comprovativoTamanho: comprovativo.tamanho,
      comprovativoDados: bytes as Uint8Array<ArrayBuffer>,
    },
  });
}
