"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const ESTADOS = [
  { valor: "", rotulo: "Todos" },
  { valor: "ABERTO", rotulo: "Abertos" },
  { valor: "ATRIBUIDO", rotulo: "Atribuídos" },
  { valor: "CONCLUIDO", rotulo: "Concluídos" },
  { valor: "CANCELADO", rotulo: "Cancelados" },
];

export function FiltroPedidos() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [valor, setValor] = useState(searchParams.get("estado") ?? "");
  const [isPending, startTransition] = useTransition();

  function mudar(estado: string) {
    setValor(estado);
    startTransition(() => {
      const params = new URLSearchParams();
      if (estado) {
        params.set("estado", estado);
      }
      router.replace(`/armador/pedidos?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ESTADOS.map((e) => (
        <button
          key={e.valor}
          onClick={() => mudar(e.valor)}
          disabled={isPending}
          className={`rounded-full px-3 py-1 text-sm font-medium transition ${
            valor === e.valor
              ? "bg-sky-700 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          } ${isPending ? "opacity-50" : ""}`}
        >
          {e.rotulo}
        </button>
      ))}
    </div>
  );
}
