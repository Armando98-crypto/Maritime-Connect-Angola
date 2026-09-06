"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registoSchema } from "@/lib/validacoes/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
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
    <AuthLayout
      tituloPainel="Junte-se à rede de agenciamento marítimo do Namibe."
      descricaoPainel="Armadores publicam pedidos, agentes verificados respondem com propostas. Simples, comparável e sem depender de contactos pessoais."
    >
      <h2 className="text-2xl font-semibold text-text-primary">Criar conta</h2>
      <p className="mt-1.5 text-[15px] text-text-secondary">
        Escolha o seu perfil para começar.
      </p>

      <form onSubmit={submeter} className="mt-8 flex flex-col gap-4" noValidate>
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
          placeholder="nome@empresa.co.ao"
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
          <div className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-surface-0 p-4">
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
            <p className="text-sm text-text-secondary">
              A sua conta fica pendente de verificação da licença antes de
              poder enviar propostas.
            </p>
          </div>
        )}

        {erroGeral && (
          <ErroFormulario mensagem={erroGeral} aoTentarNovamente={enviarRegisto} />
        )}

        <Button type="submit" variante="primario" tamanho="lg" aCarregar={aCarregar} className="mt-2">
          Criar conta
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Já tem conta?{" "}
        <a href="/login" className="font-medium text-ocean-600 hover:text-navy-900">
          Entrar
        </a>
      </p>
    </AuthLayout>
  );
}
