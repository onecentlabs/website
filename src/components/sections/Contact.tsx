"use client";

import { useState } from "react";

const ENDPOINT = "https://formspree.io/f/xdarqpzg";

type Status = "idle" | "submitting" | "success" | "error";

const field =
  "w-full bg-bg-2 border hairline px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 " +
  "outline-none transition-colors focus:border-accent";

const label =
  "font-display text-[10px] tracking-widest uppercase text-muted";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { errors?: { message: string }[] }
        | null;
      setError(data?.errors?.map((x) => x.message).join(", ") ?? "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="shell pb-24 scroll-mt-20">
      <div className="border hairline bg-bg/60 p-8 sm:p-10 max-w-2xl mx-auto">
        <span className="pixel-tag">Get in touch</span>
        <h2 className="mt-5 text-[clamp(1.5rem,2.5vw,2rem)]">Let&apos;s talk.</h2>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Solvers, wallets, and exchanges welcome. Drop us a line and we&apos;ll get back to you.
        </p>

        {status === "success" ? (
          <div className="mt-8 border hairline bg-bg-2 p-6 text-center">
            <div className="font-display text-[11px] tracking-widest uppercase text-accent">
              Message sent
            </div>
            <p className="mt-3 text-sm text-muted">
              Thanks for reaching out — we&apos;ll be in touch soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-5" noValidate>
            <div className="grid gap-2">
              <label htmlFor="name" className={label}>
                Name
              </label>
              <input id="name" name="name" type="text" required autoComplete="name" className={field} />
            </div>

            <div className="grid gap-2">
              <label htmlFor="email" className={label}>
                Email
              </label>
              <input id="email" name="email" type="email" required autoComplete="email" className={field} />
            </div>

            <div className="grid gap-2">
              <label htmlFor="handle" className={label}>
                Telegram / X <span className="text-muted/60 normal-case tracking-normal">— optional</span>
              </label>
              <input
                id="handle"
                name="telegram_or_x"
                type="text"
                placeholder="@yourhandle"
                className={field}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="message" className={label}>
                Message
              </label>
              <textarea id="message" name="message" required rows={5} className={`${field} resize-y`} />
            </div>

            {status === "error" && error ? (
              <p className="text-sm text-warn font-mono">{error}</p>
            ) : null}

            <div className="mt-1 flex items-center gap-4">
              <button type="submit" className="pixel-btn" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
