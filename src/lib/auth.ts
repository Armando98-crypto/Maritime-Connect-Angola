import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validacoes/auth";
import { verificarCredenciais } from "@/servicos/authServico";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Palavra-passe", type: "password" },
      },
      async authorize(credenciais) {
        // Nunca confiar no formato do payload vindo do cliente — validar
        // sempre com o mesmo schema Zod usado no formulário.
        const resultado = loginSchema.safeParse(credenciais);
        if (!resultado.success) {
          return null;
        }

        const user = await verificarCredenciais(
          resultado.data.email,
          resultado.data.password
        );
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          papel: user.papel,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.papel = (user as { papel: "ARMADOR" | "AGENTE" }).papel;
        token.isAdmin = (user as { isAdmin: boolean }).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.papel = token.papel as "ARMADOR" | "AGENTE";
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
});
