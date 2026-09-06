"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { criarPedidoSchema } from "@/lib/validacoes/pedido";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErroFormulario } from "@/components/estado/Alertas";

const CHAVE_RASCUNHO = "maritime-connect:rascunho-novo-pedido";

const estadoInicial = {
  navio: "",
  dataPrevistaChegada: "",
  detalhes: "",
};

type Campos = typeof estadoInicial;
type ErrosCampo = Partial<Record<keyof Campos, string>>;

export default function PaginaNovoPedido() {
  const router = useRouter();
  const [campos, setCampos] = useState<Campos>(estadoInicial);
  const [erros, setErros] = useState<ErrosCampo>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);

  // Ao abrir o formulário, recupera um rascunho anterior, se existir.
  // Isto cobre o caso limite de a ligação cair a meio do preenchimento:
  // o utilizador nunca perde o que já tinha escrito.
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CHAVE_RASCUNHO);
      if (guardado) {
        const dados = JSON.parse(guardado) as Partial<Campos>;
        // Nota sobre o lint: isto é uma leitura pontual de um sistema
        // externo (localStorage) feita no mount. Tem de ser um efeito
        // porque o localStorage não existe durante o render no servidor
        // (quebraria a hidratação) — não há forma de mover isto para um
        // inicializador de estado sem arriscar um "hydration mismatch".
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCampos((anterior) => ({ ...anterior, ...dados }));
      }
    } catch {
      // localStorage indisponível ou dados corrompidos — segue com o
      // formulário vazio, sem bloquear o utilizador.
    } finally {
      setRascunhoCarregado(true);
    }
  }, []);

  // Guarda o rascunho a cada alteração, depois do rascunho inicial já
  // ter sido carregado (para não sobrescrever com o estado vazio antes
  // do useEffect acima correr).
  useEffect(() => {
    if (!rascunhoCarregado) return;
    try {
      window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(campos));
    } catch {
      // Se o localStorage falhar (ex.: modo privado sem quota), o
      // formulário continua a funcionar normalmente — só perde o
      // rascunho, não a submissão actual.
    }
  }, [campos, rascunhoCarregado]);

  function limparRascunho() {
    try {
      window.localStorage.removeItem(CHAVE_RASCUNHO);
    } catch {
      // sem efeito prático se falhar
    }
  }

  function actualizarCampo<K extends keyof Campos>(campo: K, valor: Campos[K]) {
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function validar(): boolean {
    const resultado = criarPedidoSchema.safeParse(campos);
    if (resultado.success) {
      setErros({});
      return true;
    }
    const { fieldErrors } = resultado.error.flatten();
    setErros({
      navio: fieldErrors.navio?.[0],
      dataPrevistaChegada: fieldErrors.dataPrevistaChegada?.[0],
      detalhes: fieldErrors.detalhes?.[0],
    });
    return false;
  }

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    setErroGeral(null);
    if (!validar()) {
      return;
    }
    await enviarPedido();
  }

  async function enviarPedido() {
    setACarregar(true);
    setErroGeral(null);

    try {
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErroGeral(corpo?.erro ?? "Não foi possível criar o pedido. Tente novamente.");
        return;
      }

      // Sucesso: o rascunho já não é necessário.
      limparRascunho();
      router.push("/armador/pedidos");
      router.refresh();
    } catch {
      // Falha de rede: nada se perde — os campos continuam preenchidos
      // no ecrã e também guardados em localStorage, e o botão de
      // "Tentar de novo" volta a chamar a mesma função, sem duplicar
      // o pedido enquanto o utilizador não voltar a clicar.
      setErroGeral(
        "Não foi possível ligar ao servidor. O seu rascunho foi guardado — verifique a ligação e tente de novo."
      );
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10 lg:px-10">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Novo pedido</h1>
      <p className="mt-1.5 text-[15px] text-text-secondary">
        Porto do Namibe. Os agentes de navegação verificados vão ver este
        pedido assim que o publicar.
      </p>

      <form onSubmit={submeter} className="mt-8 flex flex-col gap-4" noValidate>
        <Input
          label="Nome do navio"
          name="navio"
          value={campos.navio}
          onChange={(e) => actualizarCampo("navio", e.target.value)}
          erro={erros.navio}
        />

        <Input
          label="Data prevista de chegada"
          name="dataPrevistaChegada"
          type="date"
          value={campos.dataPrevistaChegada}
          onChange={(e) => actualizarCampo("dataPrevistaChegada", e.target.value)}
          erro={erros.dataPrevistaChegada}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="detalhes" className="text-sm font-medium text-text-secondary">
            Detalhes e necessidades
          </label>
          <textarea
            id="detalhes"
            name="detalhes"
            rows={5}
            value={campos.detalhes}
            onChange={(e) => actualizarCampo("detalhes", e.target.value)}
            aria-invalid={erros.detalhes ? "true" : "false"}
            aria-describedby={erros.detalhes ? "detalhes-erro" : undefined}
            className={`rounded-[var(--radius-control)] border px-3.5 py-2.5 text-[15px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 ${
              erros.detalhes ? "border-danger" : "border-gray-300"
            }`}
            placeholder="Ex.: tipo de carga, calado, necessidade de reboque, documentação a preparar..."
          />
          {erros.detalhes && (
            <p id="detalhes-erro" className="text-sm text-danger">
              {erros.detalhes}
            </p>
          )}
        </div>

        {erroGeral && (
          <ErroFormulario mensagem={erroGeral} aoTentarNovamente={enviarPedido} />
        )}

        <Button type="submit" variante="primario" tamanho="lg" aCarregar={aCarregar} className="mt-2">
          Publicar pedido
        </Button>
      </form>
    </div>
  );
}
