import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listarPedidosAbertosParaAgente } from "@/servicos/propostaServico";

export async function GET() {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "AGENTE") {
    return NextResponse.json(
      { erro: "Só agentes de navegação podem ver o quadro de pedidos." },
      { status: 403 }
    );
  }

  const pedidos = await listarPedidosAbertosParaAgente();
  return NextResponse.json({ pedidos });
}
