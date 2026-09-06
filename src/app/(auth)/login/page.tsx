"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validacoes/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
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
    <AuthLayout
      tituloPainel="Agenciamento marítimo directo e transparente."
      descricaoPainel="Ligamos armadores e agentes de navegação verificados no Porto do Namibe — sem intermediários, com propostas comparáveis e reputação visível."
    >
      <h2 className="text-2xl font-semibold text-text-primary">Entrar</h2>
      <p className="mt-1.5 text-[15px] text-text-secondary">
        Aceda à sua conta para continuar.
      </p>

      {acabouDeRegistar && (
        <div className="mt-6">
          <SucessoFormulario mensagem="Conta criada. Introduza as suas credenciais para entrar." />
        </div>
      )}

      <form onSubmit={submeter} className="mt-8 flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nome@empresa.co.ao"
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

        <Button type="submit" variante="primario" tamanho="lg" aCarregar={aCarregar} className="mt-2">
          Entrar
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Ainda não tem conta?{" "}
        <a href="/registo" className="font-medium text-ocean-600 hover:text-navy-900">
          Criar conta
        </a>
      </p>
    </AuthLayout>
  );
}

export default function PaginaLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ConteudoLogin />
    </Suspense>
  );
}
