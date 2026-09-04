import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  aceitarProposta,
  recusarProposta,
  NaoEncontradoError,
  SemPermissaoError,
  PedidoFechadoError,
  PropostaJaDecididaError,
} from "@/servicos/propostaServico";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "ARMADOR") {
    return NextResponse.json(
      { erro: "Só armadores podem decidir sobre propostas." },
      { status: 403 }
    );
  }

  const { id: propostaId } = await params;

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido. Tente novamente." }, { status: 400 });
  }

  const acao = (corpo as { acao?: unknown })?.acao;
  if (acao !== "aceitar" && acao !== "recusar") {
    return NextResponse.json(
      { erro: "A acção deve ser 'aceitar' ou 'recusar'." },
      { status: 400 }
    );
  }

  const { pedidoId } = (corpo as { pedidoId?: unknown }) || {};
  if (typeof pedidoId !== "string" || !pedidoId) {
    return NextResponse.json(
      { erro: "É necessário indicar o pedidoId." },
      { status: 400 }
    );
  }

  try {
    if (acao === "aceitar") {
      await aceitarProposta(pedidoId, propostaId, sessao.user.id);
    } else {
      await recusarProposta(pedidoId, propostaId, sessao.user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    if (
      erro instanceof NaoEncontradoError ||
      erro instanceof SemPermissaoError ||
      erro instanceof PedidoFechadoError ||
      erro instanceof PropostaJaDecididaError
    ) {
      const status = erro instanceof NaoEncontradoError ? 404 : 409;
      return NextResponse.json({ erro: erro.message }, { status });
    }
    console.error("Erro inesperado ao decidir proposta:", erro);
    return NextResponse.json(
      { erro: "Não foi possível efectuar esta acção. Tente novamente." },
      { status: 500 }
    );
  }
}