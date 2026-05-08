"use client";

import { useEffect, useState } from "react";

type Props = {
  words: string[];
  typeMs?: number;
  deleteMs?: number;
  holdMs?: number;
  className?: string;
};

export function Typewriter({ words, typeMs = 70, deleteMs = 35, holdMs = 1400, className }: Props) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"type" | "hold" | "delete">("type");

  useEffect(() => {
    const word = words[i % words.length];
    let t: ReturnType<typeof setTimeout>;
    if (phase === "type") {
      if (text.length < word.length) {
        t = setTimeout(() => setText(word.slice(0, text.length + 1)), typeMs);
      } else {
        t = setTimeout(() => setPhase("delete"), holdMs);
      }
    } else if (phase === "delete") {
      if (text.length > 0) {
        t = setTimeout(() => setText(word.slice(0, text.length - 1)), deleteMs);
      } else {
        t = setTimeout(() => {
          setI((v) => v + 1);
          setPhase("type");
        }, 0);
      }
    } else {
      t = setTimeout(() => {}, 0);
    }
    return () => clearTimeout(t);
  }, [text, phase, i, words, typeMs, deleteMs, holdMs]);

  return (
    <span className={`tw-cursor ${className ?? ""}`} aria-live="polite">
      {text}
    </span>
  );
}
