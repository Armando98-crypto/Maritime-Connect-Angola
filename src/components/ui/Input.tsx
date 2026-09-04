import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  erro?: string;
}

/**
 * Input com label sempre visível (acessibilidade: nunca usamos apenas
 * placeholder como label) e espaço reservado para mensagem de erro.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, erro, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name;
    const erroId = erro ? `${inputId}-erro` : undefined;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={erro ? "true" : "false"}
          aria-describedby={erroId}
          className={`rounded-md border px-3 py-2 text-base outline-none transition focus:ring-2 focus:ring-sky-500 ${
            erro ? "border-red-500" : "border-slate-300"
          } ${className}`}
          {...props}
        />
        {erro && (
          <p id={erroId} className="text-sm text-red-600">
            {erro}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
