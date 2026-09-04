import Link from "next/link";
import { auth } from "@/lib/auth";
import { contarNaoLidas } from "@/servicos/notificacaoServico";

interface NotificacaoBadgeProps {
  href: string;
}

export async function NotificacaoBadge({ href }: NotificacaoBadgeProps) {
  const sessao = await auth();
  if (!sessao?.user) return null;

  const naoLidas = await contarNaoLidas(sessao.user.id);

  return (
    <Link
      href={href}
      className="relative inline-flex items-center text-slate-600 hover:text-sky-700"
      aria-label={`Notificações${naoLidas > 0 ? ` (${naoLidas} não lidas)` : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>
      {naoLidas > 0 && (
        <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {naoLidas > 99 ? "99+" : naoLidas}
        </span>
      )}
    </Link>
  );
}
