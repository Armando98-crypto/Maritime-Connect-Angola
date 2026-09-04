import { auth } from "@/lib/auth";
import { listarNotificacoes } from "@/servicos/notificacaoServico";
import { MarcarLida } from "@/components/notificacoes/MarcarLida";

const rotuloTipo: Record<string, string> = {
  PROPOSTA_RECEBIDA: "Nova proposta",
  PROPOSTA_ACEITE: "Proposta aceite",
  PROPOSTA_RECUSADA: "Proposta recusada",
};

const corTipo: Record<string, string> = {
  PROPOSTA_RECEBIDA: "bg-sky-100 text-sky-800",
  PROPOSTA_ACEITE: "bg-green-100 text-green-800",
  PROPOSTA_RECUSADA: "bg-red-100 text-red-800",
};

const formatadorData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PaginaNotificacoesArmador() {
  const sessao = await auth();
  const notificacoes = await listarNotificacoes(sessao!.user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Notificações</h1>

      {notificacoes.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center">
          <p className="text-slate-600">Ainda não tem notificações.</p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {notificacoes.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border px-4 py-3 ${
                n.lida
                  ? "border-slate-200 bg-white"
                  : "border-sky-200 bg-sky-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${corTipo[n.tipo]}`}
                    >
                      {rotuloTipo[n.tipo]}
                    </span>
                    {!n.lida && (
                      <span className="h-2 w-2 rounded-full bg-sky-600" />
                    )}
                  </div>
                  <p className="mt-1 font-medium text-slate-900">{n.titulo}</p>
                  <p className="text-sm text-slate-600">{n.mensagem}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatadorData.format(n.criadoEm)}
                  </p>
                </div>
                {!n.lida && <MarcarLida notificacaoId={n.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
