"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";

export function BuscaPedidos() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [valor, setValor] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      if (valor.trim()) {
        params.set("q", valor.trim());
      }
      router.replace(`/agente/pedidos?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={submeter} className="flex items-end gap-2">
      <Input
        label="Pesquisar por navio"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Nome do navio..."
        className="text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="mb-0.5 rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:bg-sky-300"
      >
        {isPending ? "..." : "Pesquisar"}
      </button>
    </form>
  );
}
