import type { ReactNode, HTMLAttributes } from "react";

type VarianteCard = "primario" | "secundario" | "interactivo" | "destacado";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variante?: VarianteCard;
}

const estilosPorVariante: Record<VarianteCard, string> = {
  // Conteúdo principal de uma página (o pedido, a proposta, o registo).
  primario:
    "bg-white border border-gray-100 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-[var(--shadow-md)]",
  // Blocos de apoio (resumo, metadados) — mais discretos que o primário.
  secundario: "bg-surface-0 border border-gray-100 transition-colors duration-300 hover:border-gray-300",
  // Clicável — usado em listas de pedidos/propostas navegáveis.
  interactivo:
    "bg-white border border-gray-100 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-[var(--shadow-md)] cursor-pointer",
  // Uma acção ou informação que deve destacar-se das restantes (ex.:
  // a proposta já aceite, o CTA final da homepage).
  destacado:
    "bg-navy-900 text-white border border-navy-800 transition-all duration-300 hover:-translate-y-1 hover:border-navy-700",
};

/**
 * Card único para toda a plataforma, com 4 níveis. Evitar envolver
 * tudo em cards "porque sim" — usar apenas para KPIs, pedidos,
 * propostas, agentes, e blocos de actividade (ver secção 23 do
 * briefing de design).
 */
export function Card({
  children,
  variante = "primario",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-card)] p-5 ${estilosPorVariante[variante]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
