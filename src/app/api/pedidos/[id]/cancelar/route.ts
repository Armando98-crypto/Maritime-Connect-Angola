import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  cancelarPedido,
  PedidoNaoEncontradoError,
  SemPermissaoPedidoError,
  PedidoNaoCancelavelError,
} from "@/servicos/pedidoServico";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "ARMADOR") {
    return NextResponse.json(
      { erro: "Só armadores podem cancelar pedidos." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    await cancelarPedido(id, sessao.user.id);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    if (erro instanceof PedidoNaoEncontradoError) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    if (erro instanceof SemPermissaoPedidoError) {
      return NextResponse.json({ erro: erro.message }, { status: 403 });
    }
    if (erro instanceof PedidoNaoCancelavelError) {
      return NextResponse.json({ erro: erro.message }, { status: 409 });
    }
    console.error("Erro inesperado ao cancelar pedido:", erro);
    return NextResponse.json(
      { erro: "Não foi possível cancelar o pedido. Tente novamente." },
      { status: 500 }
    );
  }
}
