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
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={erro ? "true" : "false"}
          aria-describedby={erroId}
          className={`rounded-md border bg-white px-3 py-2 text-base outline-none transition focus:ring-2 focus:ring-sky-500 ${
            erro ? "border-red-500" : "border-slate-300"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {erro && (
          <p id={erroId} className="text-sm text-red-600">
            {erro}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
