import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  definirVerificacaoLicenca,
  AgenteNaoEncontradoError,
} from "@/servicos/adminServico";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (!sessao.user.isAdmin) {
    return NextResponse.json(
      { erro: "Só administradores podem efectuar esta acção." },
      { status: 403 }
    );
  }

  const corpo = await request.json().catch(() => null);
  if (!corpo || typeof corpo.verificada !== "boolean") {
    return NextResponse.json(
      { erro: "O campo \"verificada\" é obrigatório e deve ser booleano." },
      { status: 400 }
    );
  }

  const { userId } = await params;

  try {
    await definirVerificacaoLicenca(userId, corpo.verificada);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    if (erro instanceof AgenteNaoEncontradoError) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    console.error("Erro inesperado ao verificar licença:", erro);
    return NextResponse.json(
      { erro: "Não foi possível actualizar a licença. Tente novamente." },
      { status: 500 }
    );
  }
}