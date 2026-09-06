"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevelarProps {
  children: ReactNode;
  atrasoMs?: number;
}

/**
 * Envolve conteúdo da homepage e faz-lhe um fade-up suave quando entra
 * no ecrã (IntersectionObserver). Só anima uma vez — depois de visível
 * fica visível.
 */
export function Revelar({ children, atrasoMs = 0 }: RevelarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${atrasoMs}ms` }}
      className={`transform-gpu transition-all duration-700 ease-out will-change-transform ${
        visivel ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}