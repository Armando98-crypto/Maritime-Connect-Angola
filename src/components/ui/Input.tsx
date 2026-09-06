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
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={erro ? "true" : "false"}
          aria-describedby={erroId}
          className={`rounded-[var(--radius-control)] border px-3.5 py-2.5 text-[15px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 ${
            erro ? "border-danger" : "border-gray-300"
          } ${className}`}
          {...props}
        />
        {erro && (
          <p id={erroId} className="text-sm text-danger">
            {erro}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
