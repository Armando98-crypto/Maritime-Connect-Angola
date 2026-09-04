import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { criarAvaliacaoSchema } from "@/lib/validacoes/avaliacao";
import {
  avaliarPedido,
  AvaliacaoDuplicadaError,
  AvaliacaoNaoEncontradaError,
  PedidoNaoConcluidoError,
  PedidoSemAgenteError,
  SemPermissaoAvaliacaoError,
} from "@/servicos/avaliacaoServico";

export async function POST(request: Request) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "ARMADOR") {
    return NextResponse.json(
      { erro: "Só armadores podem avaliar serviços." },
      { status: 403 }
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido. Tente novamente." }, { status: 400 });
  }

  const pedidoId = (corpo as { pedidoId?: unknown })?.pedidoId;
  if (typeof pedidoId !== "string" || !pedidoId) {
    return NextResponse.json(
      { erro: "É necessário indicar o pedidoId." },
      { status: 400 }
    );
  }

  const resultado = criarAvaliacaoSchema.safeParse(corpo);
  if (!resultado.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: resultado.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const avaliacao = await avaliarPedido(pedidoId, sessao.user.id, resultado.data);
    return NextResponse.json({ avaliacao }, { status: 201 });
  } catch (erro) {
    if (erro instanceof AvaliacaoDuplicadaError) {
      return NextResponse.json({ erro: erro.message }, { status: 409 });
    }
    if (erro instanceof AvaliacaoNaoEncontradaError) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    if (
      erro instanceof SemPermissaoAvaliacaoError ||
      erro instanceof PedidoNaoConcluidoError ||
      erro instanceof PedidoSemAgenteError
    ) {
      return NextResponse.json({ erro: erro.message }, { status: 409 });
    }
    console.error("Erro inesperado ao avaliar pedido:", erro);
    return NextResponse.json(
      { erro: "Não foi possível avaliar o pedido. Tente novamente." },
      { status: 500 }
    );
  }
}