import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listarComissoesDoAgente } from "@/servicos/comissaoServico";

export async function GET() {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "AGENTE") {
    return NextResponse.json(
      { erro: "Só agentes podem ver as suas comissões." },
      { status: 403 }
    );
  }

  const comissoes = await listarComissoesDoAgente(sessao.user.id);
  return NextResponse.json({ comissoes });
}