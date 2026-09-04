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
 * fixa da plataforma. Arredonda a 2 casas decimais.
 */
export function calcularValorComissao(valorBase: number): number {
  const valor = (valorBase * PERCENTAGEM_COMISSAO) / 100;
  return Math.round(valor * 100) / 100;
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
