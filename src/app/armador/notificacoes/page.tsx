import { auth } from "@/lib/auth";
import { ListaNotificacoes } from "@/components/notificacoes/ListaNotificacoes";

export default async function PaginaNotificacoesArmador() {
  const sessao = await auth();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 lg:px-10">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Notificações
      </h1>
      <ListaNotificacoes userId={sessao!.user.id} />
    </div>
  );
}
