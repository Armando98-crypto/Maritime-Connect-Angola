import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { criarPropostaSchema } from "@/lib/validacoes/proposta";
import {
  criarProposta,
  listarPropostasDoAgente,
  PedidoIndisponivelError,
  ProprioPedidoError,
  PropostaDuplicadaError,
} from "@/servicos/propostaServico";

export async function POST(request: Request) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "AGENTE") {
    return NextResponse.json(
      { erro: "Só agentes de navegação podem enviar propostas." },
      { status: 403 }
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido. Tente novamente." }, { status: 400 });
  }

  const resultado = criarPropostaSchema.safeParse(corpo);
  if (!resultado.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: resultado.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const proposta = await criarProposta(sessao.user.id, resultado.data);
    return NextResponse.json({ proposta }, { status: 201 });
  } catch (erro) {
    if (
      erro instanceof PedidoIndisponivelError ||
      erro instanceof ProprioPedidoError ||
      erro instanceof PropostaDuplicadaError
    ) {
      return NextResponse.json({ erro: erro.message }, { status: 409 });
    }
    console.error("Erro inesperado ao criar proposta:", erro);
    return NextResponse.json(
      { erro: "Não foi possível enviar a proposta. Tente novamente." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "AGENTE") {
    return NextResponse.json(
      { erro: "Só agentes de navegação podem ver esta lista." },
      { status: 403 }
    );
  }

  const propostas = await listarPropostasDoAgente(sessao.user.id);
  return NextResponse.json({ propostas });
}
