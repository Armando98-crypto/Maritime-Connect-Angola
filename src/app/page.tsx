import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HeaderPublico } from "@/components/marketing/Header";
import { Hero } from "@/components/marketing/Hero";
import { Contexto } from "@/components/marketing/Contexto";
import { Solucao } from "@/components/marketing/Solucao";
import { ComoFunciona } from "@/components/marketing/ComoFunciona";
import { ParaArmadores } from "@/components/marketing/ParaArmadores";
import { ParaAgentes } from "@/components/marketing/ParaAgentes";
import { Servico } from "@/components/marketing/Servico";
import { Confianca } from "@/components/marketing/Confianca";
import { CtaFinal } from "@/components/marketing/CtaFinal";
import { FooterInstitucional } from "@/components/marketing/FooterInstitucional";
import { Revelar } from "@/components/marketing/Revelar";

export default async function PaginaInicial() {
  const sessao = await auth();

  if (sessao?.user?.isAdmin) {
    redirect("/admin");
  }
  if (sessao?.user?.papel === "ARMADOR") {
    redirect("/armador/dashboard");
  }
  if (sessao?.user?.papel === "AGENTE") {
    redirect("/agente/dashboard");
  }

  return (
    <>
      <HeaderPublico />
      <main>
        <Hero />
        <Revelar><Contexto /></Revelar>
        <Revelar><Solucao /></Revelar>
        <Revelar><ComoFunciona /></Revelar>
        <Revelar><ParaArmadores /></Revelar>
        <Revelar><ParaAgentes /></Revelar>
        <Revelar><Servico /></Revelar>
        <Revelar><Confianca /></Revelar>
        <Revelar><CtaFinal /></Revelar>
      </main>
      <FooterInstitucional />
    </>
  );
}
