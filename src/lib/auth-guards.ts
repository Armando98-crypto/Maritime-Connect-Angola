import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Garante que existe sessão activa e que o utilizador tem o papel
 * ARMADOR. Usado no layout do grupo de rotas (armador) — corre uma vez
 * e protege todas as páginas dentro do grupo, em vez de repetir a
 * verificação em cada página.
 */
export async function exigirSessaoArmador() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  if (sessao.user.papel !== "ARMADOR") {
    redirect("/");
  }

  return sessao;
}

/**
 * Equivalente para o papel AGENTE.
 */
export async function exigirSessaoAgente() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  if (sessao.user.papel !== "AGENTE") {
    redirect("/");
  }

  return sessao;
}

/**
 * Garante que existe sessão activa e que o utilizador é administrador da
 * plataforma (isAdmin). Usado no layout do grupo de rotas (admin).
 */
export async function exigirSessaoAdmin() {
  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/login");
  }

  if (!sessao.user.isAdmin) {
    redirect("/");
  }

  return sessao;
}
