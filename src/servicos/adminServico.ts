import { prisma } from "@/lib/prisma";
import {
  ComissaoNaoEncontradaError,
  ComissaoJaPagaError,
  ComissaoSemComprovativoError,
} from "./comissaoServico";

/**
 * O utilizador tentou aceder a uma área de administração sem ser admin.
 * Usado nas rotas da API como rede de segurança (o layout já protege as
 * páginas com exigirSessaoAdmin).
 */
export class SemPermissaoAdminError extends Error {
  constructor() {
    super("Só administradores podem efectuar esta acção.");
    this.name = "SemPermissaoAdminError";
  }
}

/**
 * O id apontado não corresponde a um agente com perfil registado.
 */
export class AgenteNaoEncontradoError extends Error {
  constructor() {
    super("O agente não foi encontrado ou não tem perfil registado.");
    this.name = "AgenteNaoEncontradoError";
  }
}

/**
 * Lista todos os agentes com o respectivo perfil (empresa, licença e
 * estado de verificação), mais recentes primeiro. É o que o painel de
 * administração mostra para validar documentação.
 */
export async function listarAgentes() {
  return prisma.user.findMany({
    where: { papel: "AGENTE" },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      email: true,
      criadoEm: true,
      perfilAgente: {
        select: {
          nomeEmpresa: true,
          numeroLicenca: true,
          licencaVerificada: true,
        },
      },
    },
  });
}

/**
 * Marca a licença de um agente como verificada (ou volta a pô-la como
 * pendente). Só faz sentido para utilizadores com papel AGENTE e perfil
 * registado.
 */
export async function definirVerificacaoLicenca(
  userId: string,
  verificada: boolean
) {
  const perfil = await prisma.perfilAgente.findUnique({
    where: { userId },
    select: { userId: true },
  });

  if (!perfil) {
    throw new AgenteNaoEncontradoError();
  }

  return prisma.perfilAgente.update({
    where: { userId },
    data: { licencaVerificada: verificada },
  });
}

/**
 * Lista todas as comissões da plataforma, com o navio do pedido e o
 * agente que a deve (o da proposta aceite). O admin usa isto para saber
 * quanto está pendente de cobrança e confirmar pagamentos.
 */
export async function listarComissoes() {
  return prisma.comissao.findMany({
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      valorBase: true,
      percentagem: true,
      valorComissao: true,
      estado: true,
      comprovativoNome: true,
      criadoEm: true,
      pedido: {
        select: {
          navio: true,
          propostaAceite: {
            select: {
              agente: {
                select: {
                  nome: true,
                  perfilAgente: { select: { nomeEmpresa: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Confirma o recebimento de uma comissão. É o administrador da
 * plataforma que confirma — não o agente (que é quem deve). Para haver
 * credibilidade, a comissão só pode ser confirmada depois de o agente
 * anexar o comprovativo de pagamento.
 */
export async function confirmarPagamentoComissao(comissaoId: string) {
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: { id: true, estado: true, comprovativoNome: true },
  });

  if (!comissao) {
    throw new ComissaoNaoEncontradaError();
  }

  if (comissao.estado !== "PENDENTE") {
    throw new ComissaoJaPagaError();
  }

  if (!comissao.comprovativoNome) {
    throw new ComissaoSemComprovativoError();
  }

  return prisma.comissao.update({
    where: { id: comissaoId },
    data: { estado: "PAGA" },
  });
}

/**
 * Devolve o comprovativo anexado a uma comissão (bytes + metadados),
 * para o administrador verificar/descarregar antes de confirmar.
 */
export async function obterComprovativoComissao(comissaoId: string) {
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: {
      comprovativoNome: true,
      comprovativoTipo: true,
      comprovativoDados: true,
    },
  });

  if (!comissao) {
    throw new ComissaoNaoEncontradaError();
  }

  if (!comissao.comprovativoDados) {
    throw new ComissaoSemComprovativoError();
  }

  return comissao;
}

/**
 * Resumo para o quadro de bordo do administrador: quantos agentes estão
 * com licença por verificar e quantas comissões estão pendentes.
 */
export async function obterResumoAdmin() {
  const [perfisPendentes, comissoesPendentes] = await Promise.all([
    prisma.perfilAgente.findMany({
      where: { licencaVerificada: false },
      select: { userId: true },
    }),
    prisma.comissao.count({ where: { estado: "PENDENTE" } }),
  ]);

  return {
    agentesPorVerificar: perfisPendentes.length,
    comissoesPendentes,
  };
}