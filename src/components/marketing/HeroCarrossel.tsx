"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const imagens = ["/img/banner.jpg", "/img/banner-2.jpg", "/img/banner-3.jpg"];
const intervaloMs = 6500;

/**
 * Fundo em carrossel do Hero: alterna os banners com crossfade suave e
 * um zoom lento (efeito Ken Burns) na imagem activa. Indicadores em
 * baixo permitem saltar directamente para um banner.
 */
export function HeroCarrossel() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndice((atual) => (atual + 1) % imagens.length);
    }, intervaloMs);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div className="absolute inset-0" aria-hidden="true">
        {imagens.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={`absolute inset-0 h-full w-full object-cover hero-imagem ${
              i === indice ? "hero-imagem-activa" : ""
            }`}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/65 to-navy-900/90"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2">
        {imagens.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndice(i)}
            aria-label={`Ver imagem ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === indice
                ? "w-8 bg-white"
                : "w-3 bg-white/40 hover:scale-125 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </>
  );
}