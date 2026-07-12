"use client";

import { useState } from "react";
import { Reveal } from "@/components/effects/Reveal";

const ENDPOINT = "https://formspree.io/f/xdarqpzg";

type Status = "idle" | "submitting" | "success" | "error";

const field =
  "w-full bg-bg-2 border hairline px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 " +
  "outline-none transition-colors focus:border-accent";

const label =
  "font-display text-[10px] tracking-widest uppercase text-muted";

type Platform = "telegram" | "x";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

const PLATFORMS: { id: Platform; name: string; icon: () => React.ReactNode }[] = [
  { id: "telegram", name: "Telegram", icon: TelegramIcon },
  { id: "x", name: "X", icon: XIcon },
];

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("telegram");
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = PLATFORMS.find((p) => p.id === platform)!;

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
      <Reveal className="border hairline bg-bg/60 p-8 sm:p-10 max-w-2xl mx-auto">
        <span className="pixel-tag">Get in touch</span>
        <h2 className="mt-5 text-[clamp(1.5rem,2.5vw,2rem)]">Let&apos;s talk.</h2>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Building a wallet, exchange, or solver? Tell us what you&apos;re routing — we reply within a day.
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
              <div className="flex">
                <div
                  className="relative"
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setPickerOpen(false);
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Platform: ${selected.name}`}
                    aria-expanded={pickerOpen}
                    onClick={() => setPickerOpen((v) => !v)}
                    className="h-full flex items-center gap-1.5 bg-bg-2 border hairline border-r-0 px-3 text-muted hover:text-ink transition-colors"
                  >
                    <selected.icon />
                    <svg viewBox="0 0 10 6" width="8" height="5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path d="M1 1l4 4 4-4" />
                    </svg>
                  </button>
                  {pickerOpen && (
                    <div className="absolute left-0 top-full z-10 mt-1 min-w-36 border hairline bg-bg-2">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPlatform(p.id);
                            setPickerOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:text-ink hover:bg-bg ${
                            p.id === platform ? "text-ink" : "text-muted"
                          }`}
                        >
                          <p.icon />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  id="handle"
                  name="telegram_or_x"
                  type="text"
                  placeholder="@yourhandle"
                  className={`${field} flex-1`}
                />
                <input type="hidden" name="platform" value={selected.name} />
              </div>
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
              <button
                type="submit"
                className="pixel-btn w-full sm:w-auto justify-center"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        )}
      </Reveal>
    </section>
  );
}
