import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listarNotificacoes, contarNaoLidas } from "@/servicos/notificacaoServico";

export async function GET() {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  const [notificacoes, naoLidas] = await Promise.all([
    listarNotificacoes(sessao.user.id),
    contarNaoLidas(sessao.user.id),
  ]);

  return NextResponse.json({ notificacoes, naoLidas });
}
