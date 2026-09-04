import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  obterComprovativoComissao,
} from "@/servicos/adminServico";
import {
  ComissaoNaoEncontradaError,
  ComissaoSemComprovativoError,
} from "@/servicos/comissaoServico";

const extensoes: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (!sessao.user.isAdmin) {
    return NextResponse.json(
      { erro: "Só administradores podem descarregar comprovativos." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const comprovativo = await obterComprovativoComissao(id);
    const tipo = comprovativo.comprovativoTipo ?? "application/octet-stream";
    const extensao = extensoes[tipo] ?? "bin";

    return new NextResponse(comprovativo.comprovativoDados, {
      headers: {
        "Content-Type": tipo,
        "Content-Disposition": `attachment; filename="comprovativo-${id}.${extensao}"`,
      },
    });
  } catch (erro) {
    if (
      erro instanceof ComissaoNaoEncontradaError ||
      erro instanceof ComissaoSemComprovativoError
    ) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    console.error("Erro inesperado ao descarregar comprovativo:", erro);
    return NextResponse.json(
      { erro: "Não foi possível descarregar o comprovativo. Tente novamente." },
      { status: 500 }
    );
  }
}