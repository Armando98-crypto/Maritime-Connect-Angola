import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  marcarComissaoPaga,
  ComissaoNaoEncontradaError,
  ComissaoJaPagaError,
  SemPermissaoComissaoError,
} from "@/servicos/comissaoServico";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "AGENTE") {
    return NextResponse.json(
      { erro: "Só agentes podem marcar as suas comissões como pagas." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    await marcarComissaoPaga(id, sessao.user.id);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    if (erro instanceof ComissaoNaoEncontradaError) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    if (
      erro instanceof SemPermissaoComissaoError ||
      erro instanceof ComissaoJaPagaError
    ) {
      return NextResponse.json({ erro: erro.message }, { status: 409 });
    }
    console.error("Erro inesperado ao marcar comissão como paga:", erro);
    return NextResponse.json(
      { erro: "Não foi possível marcar a comissão como paga. Tente novamente." },
      { status: 500 }
    );
  }
}