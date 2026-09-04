import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default async function PaginaInicial() {
  const sessao = await auth();

  if (sessao?.user?.isAdmin) {
    redirect("/admin");
  }

  if (sessao?.user?.papel === "ARMADOR") {
    redirect("/armador/dashboard");
  }

  if (sessao?.user?.papel === "AGENTE") {
    redirect("/agente/dashboard");
  }

  if (!sessao?.user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Maritime Connect Angola
          </h1>
          <p className="mt-2 text-slate-600">
            Agenciamento marítimo directo e transparente no Porto do Namibe.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Link href="/login">
            <Button className="w-full">Entrar</Button>
          </Link>
          <Link href="/registo">
            <Button variante="secundario" className="w-full">
              Criar conta
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return null;
}
