import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  obterPerfilAgente,
  atualizarPerfilAgente,
  PerfilNaoEncontradoError,
} from "@/servicos/perfilServico";
import { atualizarPerfilAgenteSchema } from "@/lib/validacoes/perfil";

export async function GET() {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "AGENTE") {
    return NextResponse.json(
      { erro: "Só agentes podem aceder ao perfil de agente." },
      { status: 403 }
    );
  }

  const perfil = await obterPerfilAgente(sessao.user.id);

  if (!perfil) {
    return NextResponse.json({ erro: "Perfil não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ perfil });
}

export async function PATCH(request: Request) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "AGENTE") {
    return NextResponse.json(
      { erro: "Só agentes podem actualizar o perfil de agente." },
      { status: 403 }
    );
  }

  const corpo = await request.json();
  const resultado = atualizarPerfilAgenteSchema.safeParse(corpo);

  if (!resultado.success) {
    const erro = resultado.error.issues[0];
    return NextResponse.json(
      { erro: erro.message },
      { status: 400 }
    );
  }

  try {
    await atualizarPerfilAgente(sessao.user.id, resultado.data);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    if (erro instanceof PerfilNaoEncontradoError) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    console.error("Erro inesperado ao actualizar perfil:", erro);
    return NextResponse.json(
      { erro: "Não foi possível actualizar o perfil. Tente novamente." },
      { status: 500 }
    );
  }
}
