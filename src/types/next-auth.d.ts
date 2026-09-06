import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      papel: "ARMADOR" | "AGENTE";
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    papel: "ARMADOR" | "AGENTE";
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    papel: "ARMADOR" | "AGENTE";
    isAdmin: boolean;
  }
}
