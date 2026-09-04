import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listarAvaliacoesRecebidas } from "@/servicos/avaliacaoServico";

export async function GET() {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "AGENTE") {
    return NextResponse.json(
      { erro: "Só agentes podem ver as avaliações recebidas." },
      { status: 403 }
    );
  }

  const avaliacoes = await listarAvaliacoesRecebidas(sessao.user.id);
  return NextResponse.json({ avaliacoes });
}