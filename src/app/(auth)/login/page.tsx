"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validacoes/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErroFormulario, SucessoFormulario } from "@/components/estado/Alertas";

function ConteudoLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const acabouDeRegistar = searchParams.get("registado") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erros, setErros] = useState<{ email?: string; password?: string }>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);

  function validar(): boolean {
    const resultado = loginSchema.safeParse({ email, password });
    if (resultado.success) {
      setErros({});
      return true;
    }
    const flatten = resultado.error.flatten().fieldErrors;
    setErros({ email: flatten.email?.[0], password: flatten.password?.[0] });
    return false;
  }

  async function entrar() {
    setACarregar(true);
    setErroGeral(null);

    try {
      const resultado = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (resultado?.error) {
        setErroGeral("Email ou palavra-passe incorrectos.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErroGeral(
        "Não foi possível ligar ao servidor. Verifique a sua ligação e tente de novo."
      );
    } finally {
      setACarregar(false);
    }
  }

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    setErroGeral(null);
    if (!validar()) {
      return;
    }
    await entrar();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Maritime Connect Angola — agenciamento marítimo no Porto do Namibe.
        </p>
      </div>

      {acabouDeRegistar && (
        <SucessoFormulario mensagem="Conta criada com sucesso. Introduza as suas credenciais para entrar." />
      )}

      <form onSubmit={submeter} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={erros.email}
        />
        <Input
          label="Palavra-passe"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          erro={erros.password}
        />

        {erroGeral && <ErroFormulario mensagem={erroGeral} aoTentarNovamente={entrar} />}

        <Button type="submit" aCarregar={aCarregar}>
          Entrar
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Ainda não tem conta?{" "}
        <a href="/registo" className="font-medium text-sky-700 underline">
          Criar conta
        </a>
      </p>
    </main>
  );
}

export default function PaginaLogin() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
          <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
        </main>
      }
    >
      <ConteudoLogin />
    </Suspense>
  );
}
