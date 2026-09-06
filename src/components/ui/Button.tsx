import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  aCarregar?: boolean;
  variante?: "primario" | "secundario" | "fantasma" | "perigo";
  tamanho?: "sm" | "md" | "lg";
}

const estilosPorVariante: Record<NonNullable<ButtonProps["variante"]>, string> = {
  // Navy sólido — reservar para UMA acção principal por ecrã.
  primario:
    "bg-navy-900 text-white hover:bg-navy-800 disabled:bg-gray-300 disabled:text-gray-500",
  // Outline discreto — a acção "por omissão" na maioria dos ecrãs.
  secundario:
    "bg-white text-navy-900 border border-gray-300 hover:border-navy-700 hover:bg-surface-0 disabled:text-gray-500 disabled:border-gray-100",
  // Sem contorno — para acções terciárias dentro de listas/tabelas.
  fantasma:
    "bg-transparent text-navy-900 hover:bg-surface-0 disabled:text-gray-500",
  perigo:
    "bg-white text-danger border border-danger/30 hover:bg-danger-bg disabled:text-gray-500 disabled:border-gray-100",
};

const estilosPorTamanho: Record<NonNullable<ButtonProps["tamanho"]>, string> = {
  sm: "px-3 py-1.5 text-sm rounded-[var(--radius-control)]",
  md: "px-4 py-2.5 text-[15px] rounded-[var(--radius-control)]",
  lg: "px-6 py-3.5 text-base rounded-[var(--radius-control)]",
};

/**
 * Botão único para todo o projecto. Só um "primario" deve existir por
 * ecrã — o resto usa "secundario" ou "fantasma" (regra de contenção
 * visual: nem tudo pode gritar ao mesmo tempo).
 */
export function Button({
  aCarregar = false,
  variante = "secundario",
  tamanho = "md",
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || aCarregar}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] active:translate-y-0 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:translate-y-0 ${estilosPorVariante[variante]} ${estilosPorTamanho[tamanho]} ${className}`}
      {...props}
    >
      {aCarregar && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
