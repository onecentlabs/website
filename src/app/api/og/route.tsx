import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? `${site.name} — ${site.tagline}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "linear-gradient(135deg, #07091a 0%, #0c1030 60%, #131845 100%)",
          color: "#f5f7ff",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "#ffb703",
              border: "6px solid #ffd23f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5a3a00",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            1¢
          </div>
          <div style={{ fontSize: 28, letterSpacing: 6, color: "#a3a8d1" }}>ONECENT LABS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              maxWidth: 1000,
              color: "#f5f7ff",
              textShadow: "4px 4px 0 #07091a",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#43e7ff" }}>
            {site.tagline}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 22, color: "#b6ff3c" }}>
          <span style={{ background: "#0c1030", padding: "10px 18px", border: "4px solid #b6ff3c" }}>ROUTER</span>
          <span style={{ background: "#0c1030", padding: "10px 18px", border: "4px solid #43e7ff", color: "#43e7ff" }}>RATES</span>
          <span style={{ background: "#0c1030", padding: "10px 18px", border: "4px solid #ff3ea5", color: "#ff3ea5" }}>SEARCH</span>
          <span style={{ background: "#0c1030", padding: "10px 18px", border: "4px solid #ffd23f", color: "#ffd23f" }}>COW SOLVER</span>
        </div>
      </div>
    ),
    size
  );
}
