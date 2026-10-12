import { useMemo } from "react";
import { Info } from "lucide-react";
import { splitGlossaryText } from "../lib/swim-school/glossary.js";

export default function SchoolRichText({ text, onTerm }) {
  const parts = useMemo(() => splitGlossaryText(text), [text]);
  return (
    <span className="ms-school-rich">
      {parts.map((part, i) =>
        part.termKey ? (
          <button
            key={`${part.termKey}-${i}`}
            type="button"
            className="ms-school-term"
            onClick={() => onTerm?.(part.termKey)}
          >
            <Info size={11} strokeWidth={2.5} aria-hidden />
            {part.text}
          </button>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}
