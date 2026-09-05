import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  anexarComprovativo,
  ComissaoNaoEncontradaError,
  ComissaoJaPagaError,
  ComprovativoInvalidoError,
  SemPermissaoComissaoError,
  TAMANHO_MAXIMO_COMPROVATIVO,
  TIPOS_COMPROVATIVO_PERMITIDOS,
} from "@/servicos/comissaoServico";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await auth();

  if (!sessao?.user) {
    return NextResponse.json({ erro: "É necessário iniciar sessão." }, { status: 401 });
  }

  if (sessao.user.papel !== "AGENTE") {
    return NextResponse.json(
      { erro: "Só agentes podem anexar comprovativos às suas comissões." },
      { status: 403 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const ficheiro = formData?.get("comprovativo");

  if (!(ficheiro instanceof File)) {
    return NextResponse.json(
      { erro: "Anexe o comprovativo de pagamento (PDF ou imagem)." },
      { status: 400 }
    );
  }

  if (!TIPOS_COMPROVATIVO_PERMITIDOS.includes(ficheiro.type)) {
    return NextResponse.json(
      { erro: "Formato não suportado. Use PDF, PNG, JPEG ou WebP." },
      { status: 400 }
    );
  }

  if (ficheiro.size === 0) {
    return NextResponse.json({ erro: "O ficheiro está vazio." }, { status: 400 });
  }

  if (ficheiro.size > TAMANHO_MAXIMO_COMPROVATIVO) {
    return NextResponse.json(
      { erro: "O comprovativo excede o tamanho máximo de 5 MB." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const dados = Buffer.from(await ficheiro.arrayBuffer());

  try {
    await anexarComprovativo(id, sessao.user.id, {
      nome: ficheiro.name,
      tipo: ficheiro.type,
      tamanho: ficheiro.size,
      dados,
    });
    return NextResponse.json({ ok: true });
  } catch (erro) {
    if (erro instanceof ComprovativoInvalidoError) {
      return NextResponse.json({ erro: erro.message }, { status: 400 });
    }
    if (erro instanceof ComissaoNaoEncontradaError) {
      return NextResponse.json({ erro: erro.message }, { status: 404 });
    }
    if (
      erro instanceof SemPermissaoComissaoError ||
      erro instanceof ComissaoJaPagaError
    ) {
      return NextResponse.json({ erro: erro.message }, { status: 409 });
    }
    console.error("Erro inesperado ao anexar comprovativo:", erro);
    return NextResponse.json(
      { erro: "Não foi possível enviar o comprovativo. Tente novamente." },
      { status: 500 }
    );
  }
}