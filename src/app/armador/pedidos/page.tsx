import Link from "next/link";
import { auth } from "@/lib/auth";
import { listarPedidosDoArmador } from "@/servicos/pedidoServico";
import { Button } from "@/components/ui/Button";

const rotuloEstado: Record<string, string> = {
  ABERTO: "Aberto",
  ATRIBUIDO: "Atribuído",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const corEstado: Record<string, string> = {
  ABERTO: "bg-sky-100 text-sky-800",
  ATRIBUIDO: "bg-amber-100 text-amber-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-slate-200 text-slate-600",
};

const formatadorData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function PaginaPedidos() {
  // O layout do grupo (armador) já garante sessão + papel correcto;
  // lemos a sessão outra vez aqui só para saber de quem são os pedidos
  // a listar (é JWT, sem custo extra de rede).
  const sessao = await auth();
  const pedidos = await listarPedidosDoArmador(sessao!.user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Os meus pedidos</h1>
        <Link href="/armador/pedidos/novo">
          <Button>Novo pedido</Button>
        </Link>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center">
          <p className="text-slate-600">
            Ainda não tem nenhum pedido publicado.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Publique o primeiro pedido para que os agentes de navegação
            verificados possam enviar propostas.
          </p>
          <Link href="/pedidos/novo" className="mt-4 inline-block">
            <Button>Publicar o primeiro pedido</Button>
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {pedidos.map((pedido) => (
            <li
              key={pedido.id}
              className="rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{pedido.navio}</p>
                  <p className="text-sm text-slate-600">
                    Chegada prevista: {formatadorData.format(pedido.dataPrevistaChegada)}
                  </p>
                  <p className="text-sm text-slate-500">Porto do Namibe</p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${corEstado[pedido.estado]}`}
                >
                  {rotuloEstado[pedido.estado]}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {pedido._count.propostas === 0
                  ? "Ainda sem propostas."
                  : `${pedido._count.propostas} proposta(s) recebida(s).`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
