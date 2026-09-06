import Image from "next/image";

interface CardImagemProps {
  src: string;
  alt: string;
  legenda?: string;
  tamanho?: string;
}

/**
 * Imagem emoldurada usada nas secções da página principal. Ao passar o
 * cursor: a imagem faz zoom suave (scale), um gradiente escuro aparece
 * por baixo e a legenda desliza para cima.
 */
export function CardImagem({ src, alt, legenda, tamanho = "50vw" }: CardImagemProps) {
  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-[var(--radius-hero)] shadow-[var(--shadow-sm)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={tamanho}
        className="absolute inset-0 object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy-900/60 via-navy-900/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      {legenda && (
        <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-sm font-medium text-white">{legenda}</p>
        </div>
      )}
    </div>
  );
}