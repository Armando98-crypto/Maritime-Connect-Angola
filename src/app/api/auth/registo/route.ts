import { NextResponse } from "next/server";
import { registoSchema } from "@/lib/validacoes/auth";
import {
  criarUtilizador,
  EmailJaExisteError,
  LicencaJaExisteError,
} from "@/servicos/authServico";

export async function POST(request: Request) {
  let corpo: unknown;

  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Pedido inválido. Tente novamente." },
      { status: 400 }
    );
  }

  // Nunca confiar apenas na validação já feita no formulário — o mesmo
  // schema Zod é aplicado aqui, do lado do servidor.
  const resultado = registoSchema.safeParse(corpo);
  if (!resultado.success) {
    return NextResponse.json(
      {
        erro: "Dados inválidos.",
        detalhes: resultado.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const user = await criarUtilizador(resultado.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (erro) {
    if (erro instanceof EmailJaExisteError || erro instanceof LicencaJaExisteError) {
      return NextResponse.json({ erro: erro.message }, { status: 409 });
    }

    console.error("Erro inesperado ao criar utilizador:", erro);
    return NextResponse.json(
      { erro: "Não foi possível concluir o registo. Tente novamente." },
      { status: 500 }
    );
  }
}
