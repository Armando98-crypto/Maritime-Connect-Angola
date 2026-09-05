"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registoSchema } from "@/lib/validacoes/auth";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

type Papel = "ARMADOR" | "AGENTE";
type ErrosCampo = Partial<Record<string, string>>;

const estadoInicial = {
  nome: "",
  email: "",
  password: "",
  papel: "ARMADOR" as Papel,
  nomeEmpresa: "",
  numeroLicenca: "",
};

export default function PaginaRegisto() {
  const router = useRouter();
  const [campos, setCampos] = useState(estadoInicial);
  const [erros, setErros] = useState<ErrosCampo>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);

  function actualizarCampo<K extends keyof typeof estadoInicial>(
    campo: K,
    valor: (typeof estadoInicial)[K]
  ) {
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function validar(): boolean {
    const payload =
      campos.papel === "ARMADOR"
        ? { nome: campos.nome, email: campos.email, password: campos.password, papel: "ARMADOR" as const }
        : {
            nome: campos.nome,
            email: campos.email,
            password: campos.password,
            papel: "AGENTE" as const,
            nomeEmpresa: campos.nomeEmpresa,
            numeroLicenca: campos.numeroLicenca,
          };

    const resultado = registoSchema.safeParse(payload);
    if (resultado.success) {
      setErros({});
      return true;
    }

    const { fieldErrors } = resultado.error.flatten();
    const novosErros: ErrosCampo = {};
    for (const [campo, mensagens] of Object.entries(fieldErrors)) {
      if (mensagens && mensagens.length > 0) {
        novosErros[campo] = mensagens[0];
      }
    }
    setErros(novosErros);
    return false;
  }

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    setErroGeral(null);

    if (!validar()) {
      return;
    }

    await enviarRegisto();
  }

  async function enviarRegisto() {
    setACarregar(true);
    setErroGeral(null);

    try {
      const payload =
        campos.papel === "ARMADOR"
          ? { nome: campos.nome, email: campos.email, password: campos.password, papel: "ARMADOR" }
          : {
              nome: campos.nome,
              email: campos.email,
              password: campos.password,
              papel: "AGENTE",
              nomeEmpresa: campos.nomeEmpresa,
              numeroLicenca: campos.numeroLicenca,
            };

      const resposta = await fetch("/api/auth/registo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(
          corpo?.erro ?? "Não foi possível concluir o registo. Tente novamente."
        );
        return;
      }

      // Regista com sucesso — autentica de imediato para não obrigar o
      // utilizador a introduzir as credenciais outra vez.
      const resultadoLogin = await signIn("credentials", {
        email: campos.email,
        password: campos.password,
        redirect: false,
      });

      if (resultadoLogin?.error) {
        // Conta criada mas login automático falhou (raro) — manda para
        // o login em vez de deixar o utilizador preso sem feedback.
        router.push("/login?registado=1");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      // Falha de rede: os dados do formulário continuam no estado, nada
      // se perde — o utilizador só precisa de tentar novamente.
      setErroGeral(
        "Não foi possível ligar ao servidor. Verifique a sua ligação e tente de novo."
      );
    } finally {
      setACarregar(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Criar conta</h1>
        <p className="mt-1 text-sm text-slate-600">
          Maritime Connect Angola — agenciamento marítimo no Porto do Namibe.
        </p>
      </div>

      <form onSubmit={submeter} className="flex flex-col gap-4" noValidate>
        <Select
          label="Sou"
          name="papel"
          value={campos.papel}
          onChange={(e) => actualizarCampo("papel", e.target.value as Papel)}
        >
          <option value="ARMADOR">Armador (dono/operador de navio)</option>
          <option value="AGENTE">Agente de navegação</option>
        </Select>

        <Input
          label="Nome completo"
          name="nome"
          autoComplete="name"
          value={campos.nome}
          onChange={(e) => actualizarCampo("nome", e.target.value)}
          erro={erros.nome}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={campos.email}
          onChange={(e) => actualizarCampo("email", e.target.value)}
          erro={erros.email}
        />

        <Input
          label="Palavra-passe"
          name="password"
          type="password"
          autoComplete="new-password"
          value={campos.password}
          onChange={(e) => actualizarCampo("password", e.target.value)}
          erro={erros.password}
        />

        {campos.papel === "AGENTE" && (
          <>
            <Input
              label="Nome da empresa"
              name="nomeEmpresa"
              value={campos.nomeEmpresa}
              onChange={(e) => actualizarCampo("nomeEmpresa", e.target.value)}
              erro={erros.nomeEmpresa}
            />
            <Input
              label="Número de licença"
              name="numeroLicenca"
              value={campos.numeroLicenca}
              onChange={(e) => actualizarCampo("numeroLicenca", e.target.value)}
              erro={erros.numeroLicenca}
            />
            <p className="text-sm text-slate-500">
              A sua conta fica pendente de verificação da licença antes de
              poder enviar propostas.
            </p>
          </>
        )}

        {erroGeral && (
          <ErroFormulario mensagem={erroGeral} aoTentarNovamente={enviarRegisto} />
        )}

        <Button type="submit" aCarregar={aCarregar}>
          Criar conta
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Já tem conta?{" "}
        <a href="/login" className="font-medium text-sky-700 underline">
          Entrar
        </a>
      </p>
    </main>
  );
}
