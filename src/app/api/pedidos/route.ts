import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { criarPedidoSchema } from "@/lib/validacoes/pedido";
import { criarPedido, listarPedidosDoArmador } from "@/servicos/pedidoServico";

export async function POST(request: Request) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  // Verificação de papel no servidor — a UI já esconde este formulário
  // de agentes, mas nunca confiamos só nisso: um agente a chamar a API
  // directamente também tem de ser bloqueado aqui.
  if (sessao.user.papel !== "ARMADOR") {
    return NextResponse.json(
      { erro: "Só armadores podem publicar pedidos." },
      { status: 403 }
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido. Tente novamente." }, { status: 400 });
  }

  const resultado = criarPedidoSchema.safeParse(corpo);
  if (!resultado.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: resultado.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const pedido = await criarPedido(sessao.user.id, resultado.data);
    return NextResponse.json({ pedido }, { status: 201 });
  } catch (erro) {
    console.error("Erro inesperado ao criar pedido:", erro);
    return NextResponse.json(
      { erro: "Não foi possível criar o pedido. Tente novamente." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "ARMADOR") {
    return NextResponse.json(
      { erro: "Só armadores podem ver esta lista." },
      { status: 403 }
    );
  }

  const pedidos = await listarPedidosDoArmador(sessao.user.id);
  return NextResponse.json({ pedidos });
}
