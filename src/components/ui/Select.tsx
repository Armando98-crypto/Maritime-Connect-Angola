import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  erro?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, erro, id, className = "", children, ...props }, ref) => {
    const selectId = id ?? props.name;
    const erroId = erro ? `${selectId}-erro` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={erro ? "true" : "false"}
          aria-describedby={erroId}
          className={`rounded-[var(--radius-control)] border bg-white px-3.5 py-2.5 text-[15px] text-text-primary outline-none transition-colors focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 ${
            erro ? "border-danger" : "border-gray-300"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {erro && (
          <p id={erroId} className="text-sm text-danger">
            {erro}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
