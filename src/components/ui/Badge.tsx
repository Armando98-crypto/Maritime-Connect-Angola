import type { ReactNode } from "react";

type TomBadge = "neutro" | "info" | "sucesso" | "aviso" | "erro";

interface BadgeProps {
  children: ReactNode;
  tom?: TomBadge;
}

const estilosPorTom: Record<TomBadge, string> = {
  neutro: "bg-gray-100 text-gray-700",
  info: "bg-info-bg text-ocean-600",
  sucesso: "bg-success-bg text-success",
  aviso: "bg-warning-bg text-warning",
  erro: "bg-danger-bg text-danger",
};

/**
 * Badge de estado — usado para estados de Pedido, Proposta, licença de
 * agente e comissão. Um único componente garante que o mesmo estado
 * (ex.: "Pendente") tem sempre a mesma cor em toda a plataforma.
 */
export function Badge({ children, tom = "neutro" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${estilosPorTom[tom]}`}
    >
      {children}
    </span>
  );
}

/**
 * Mapeamentos centralizados de estado -> (rótulo, tom) para os enums do
 * schema. Uma única fonte de verdade em vez de cada página inventar o
 * seu próprio texto/cor para o mesmo estado.
 */
export const estadoPedido: Record<string, { rotulo: string; tom: TomBadge }> = {
  ABERTO: { rotulo: "Aberto", tom: "info" },
  ATRIBUIDO: { rotulo: "Atribuído", tom: "aviso" },
  CONCLUIDO: { rotulo: "Concluído", tom: "sucesso" },
  CANCELADO: { rotulo: "Cancelado", tom: "neutro" },
};

export const estadoProposta: Record<string, { rotulo: string; tom: TomBadge }> = {
  PENDENTE: { rotulo: "Pendente", tom: "aviso" },
  ACEITE: { rotulo: "Aceite", tom: "sucesso" },
  RECUSADA: { rotulo: "Recusada", tom: "neutro" },
};

export const estadoComissao: Record<string, { rotulo: string; tom: TomBadge }> = {
  PENDENTE: { rotulo: "Pendente", tom: "aviso" },
  PAGA: { rotulo: "Paga", tom: "sucesso" },
};

export const estadoLicenca = {
  verificada: { rotulo: "Licença verificada", tom: "sucesso" as TomBadge },
  pendente: { rotulo: "Verificação pendente", tom: "aviso" as TomBadge },
};
