import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { confirmarPagamentoComissao } from "@/servicos/adminServico";
import {
  ComissaoNaoEncontradaError,
  ComissaoJaPagaError,
} from "@/servicos/comissaoServico";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (!sessao.user.isAdmin) {
    return NextResponse.json(
      { erro: "Só administradores podem confirmar pagamentos." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    await confirmarPagamentoComissao(id);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    if (erro instanceof ComissaoNaoEncontradaError) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    if (erro instanceof ComissaoJaPagaError) {
      return NextResponse.json({ erro: erro.message }, { status: 409 });
    }
    console.error("Erro inesperado ao confirmar pagamento da comissão:", erro);
    return NextResponse.json(
      { erro: "Não foi possível confirmar o pagamento. Tente novamente." },
      { status: 500 }
    );
  }
}