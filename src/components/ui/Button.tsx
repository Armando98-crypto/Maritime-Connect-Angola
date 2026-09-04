import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  aCarregar?: boolean;
  variante?: "primario" | "secundario";
}

/**
 * Botão único para todo o projecto. Trata o estado "a carregar" aqui,
 * uma vez, em vez de cada formulário reimplementar o mesmo padrão de
 * desactivar o botão e mostrar um spinner.
 */
export function Button({
  aCarregar = false,
  variante = "primario",
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const estilos =
    variante === "primario"
      ? "bg-sky-700 text-white hover:bg-sky-800 disabled:bg-sky-300"
      : "bg-white text-sky-700 border border-sky-700 hover:bg-sky-50 disabled:text-sky-300 disabled:border-sky-200";

  return (
    <button
      disabled={disabled || aCarregar}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-base font-medium transition disabled:cursor-not-allowed ${estilos} ${className}`}
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
