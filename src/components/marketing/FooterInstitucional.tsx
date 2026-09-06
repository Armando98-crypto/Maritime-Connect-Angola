import Link from "next/link";

export function FooterInstitucional() {
  return (
    <footer className="bg-navy-900 py-14 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 sm:flex-row sm:justify-between">
        <div className="max-w-xs">
          <p className="font-display text-lg font-semibold">Maritime Connect</p>
          <p className="mt-2 text-sm text-white/60">
            Agenciamento marítimo directo e transparente no Porto do Namibe, Angola.
          </p>
        </div>

        <div className="flex gap-16">
          <div>
            <p className="text-sm font-medium text-white/50">Produto</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-white/80">
              <li>
                <a href="#como-funciona" className="hover:text-white">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="#confianca" className="hover:text-white">
                  Confiança
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-white/50">Conta</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-white/80">
              <li>
                <Link href="/login" className="hover:text-white">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/registo" className="hover:text-white">
                  Criar conta
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 px-6 pt-6 text-xs text-white/40">
        © {new Date().getFullYear()} Maritime Connect Angola. Porto do Namibe.
      </div>
    </footer>
  );
}
