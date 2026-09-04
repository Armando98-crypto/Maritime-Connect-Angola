import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  marcarComoLida,
  SemPermissaoNotificacaoError,
  NotificacaoNaoEncontradaError,
} from "@/servicos/notificacaoServico";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await marcarComoLida(id, sessao.user.id);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    if (erro instanceof NotificacaoNaoEncontradaError) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    if (erro instanceof SemPermissaoNotificacaoError) {
      return NextResponse.json({ erro: erro.message }, { status: 403 });
    }
    console.error("Erro inesperado ao marcar notificação como lida:", erro);
    return NextResponse.json(
      { erro: "Não foi possível marcar a notificação como lida. Tente novamente." },
      { status: 500 }
    );
  }
}
