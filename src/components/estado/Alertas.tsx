interface ErroFormularioProps {
  mensagem: string;
  aoTentarNovamente?: () => void;
}

/**
 * Usado sempre que uma acção (submissão de formulário, chamada à API)
 * falha. Tratamos qualquer falha de rede como normal — nunca deixamos o
 * utilizador sem saber o que aconteceu nem sem forma de tentar de novo.
 */
export function ErroFormulario({ mensagem, aoTentarNovamente }: ErroFormularioProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span>{mensagem}</span>
      {aoTentarNovamente && (
        <button
          type="button"
          onClick={aoTentarNovamente}
          className="whitespace-nowrap font-medium underline underline-offset-2 hover:text-red-900"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function SucessoFormulario({ mensagem }: { mensagem: string }) {
  return (
    <div
      role="status"
      className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
    >
      {mensagem}
    </div>
  );
}
