import { listarNotificacoes } from "@/servicos/notificacaoServico";
import { Card } from "@/components/ui/Card";
import { MarcarLida } from "./MarcarLida";

const rotuloTipo: Record<string, string> = {
  PROPOSTA_RECEBIDA: "Nova proposta",
  PROPOSTA_ACEITE: "Proposta aceite",
  PROPOSTA_RECUSADA: "Proposta recusada",
};

const tomTipo: Record<string, string> = {
  PROPOSTA_RECEBIDA: "bg-info-bg text-ocean-600",
  PROPOSTA_ACEITE: "bg-success-bg text-success",
  PROPOSTA_RECUSADA: "bg-gray-100 text-gray-700",
};

const formatadorData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Lista de notificações, partilhada entre armador e agente — o único
 * diferencial entre os dois é de quem é a sessão, não a apresentação.
 */
export async function ListaNotificacoes({ userId }: { userId: string }) {
  const notificacoes = await listarNotificacoes(userId);

  if (notificacoes.length === 0) {
    return (
      <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-gray-300 px-6 py-16 text-center">
        <p className="text-text-primary">Ainda não tem notificações.</p>
      </div>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-2.5">
      {notificacoes.map((n) => (
        <li key={n.id}>
          <Card
            variante="secundario"
            className={n.lida ? "" : "border border-ocean-500/20 bg-ocean-100/40"}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tomTipo[n.tipo]}`}
                  >
                    {rotuloTipo[n.tipo]}
                  </span>
                  {!n.lida && <span className="h-2 w-2 rounded-full bg-ocean-600" />}
                </div>
                <p className="mt-1.5 font-medium text-text-primary">{n.titulo}</p>
                <p className="text-sm text-text-secondary">{n.mensagem}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {formatadorData.format(n.criadoEm)}
                </p>
              </div>
              {!n.lida && <MarcarLida notificacaoId={n.id} />}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
