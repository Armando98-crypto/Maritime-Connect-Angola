import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { listarPedidosDoArmador } from "@/servicos/pedidoServico";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, estadoPedido } from "@/components/ui/Badge";
import { FiltroPedidos } from "./FiltroPedidos";

const formatadorData = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function PaginaPedidos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const sessao = await auth();
  const { estado } = await searchParams;
  const pedidos = await listarPedidosDoArmador(sessao!.user.id, estado);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Os meus pedidos
        </h1>
        <Link href="/armador/pedidos/novo">
          <Button variante="primario">Novo pedido</Button>
        </Link>
      </div>

      <Suspense>
        <FiltroPedidos />
      </Suspense>

      {pedidos.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-gray-300 px-6 py-16 text-center">
          <p className="text-text-primary">
            {estado
              ? `Não tem pedidos com estado "${estadoPedido[estado]?.rotulo ?? estado}".`
              : "Ainda não tem nenhum pedido publicado."}
          </p>
          {!estado && (
            <>
              <p className="mt-1.5 text-[15px] text-text-secondary">
                Publique o primeiro pedido para que os agentes de navegação
                verificados possam enviar propostas.
              </p>
              <Link href="/armador/pedidos/novo" className="mt-5 inline-block">
                <Button variante="primario">Publicar o primeiro pedido</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {pedidos.map((pedido) => {
            const info = estadoPedido[pedido.estado];
            return (
              <li key={pedido.id}>
                <Link href={`/armador/pedidos/${pedido.id}`} className="block">
                  <Card variante="interactivo">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{pedido.navio}</p>
                        <p className="mt-0.5 text-sm text-text-secondary">
                          Chegada prevista: {formatadorData.format(pedido.dataPrevistaChegada)}
                        </p>
                        <p className="text-sm text-text-muted">Porto do Namibe</p>
                      </div>
                      <Badge tom={info.tom}>{info.rotulo}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-text-secondary">
                      {pedido._count.propostas === 0
                        ? "Ainda sem propostas."
                        : `${pedido._count.propostas} proposta(s) recebida(s) — ver detalhes →`}
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
