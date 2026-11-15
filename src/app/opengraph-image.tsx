import { ImageResponse } from "next/og";
import { BRAND, BugMark } from "./brand";

export const alt = "Defect Monitor: monitoring defect per fase pengujian";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PHASES = ["SIT", "UAT", "REGRESI", "BETA", "PROD"];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: BRAND.paper,
          color: BRAND.ink,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: BRAND.violet,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BugMark size={60} />
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>{BRAND.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>{BRAND.tagline}</div>
          <div style={{ fontSize: 26, color: "#6a6887", maxWidth: 980 }}>
            Defect log pengganti Excel untuk tim QA. Leakage antar fase, aging, exit criteria, laporan harian.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
          {PHASES.map((phase, i) => {
            const state = i < 3 ? "done" : i === 3 ? "active" : "next";
            return (
              <div
                key={phase}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexGrow: i < PHASES.length - 1 ? 1 : 0,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      border: `5px solid ${state === "next" ? "#d9d8e8" : BRAND.violet}`,
                      background: state === "done" ? BRAND.violet : BRAND.paper,
                      boxShadow: state === "active" ? "0 0 0 8px rgba(91,61,245,0.22)" : "none",
                    }}
                  />
                  <div style={{ fontSize: 24, fontWeight: 700, color: state === "next" ? "#9a99b3" : BRAND.ink }}>{phase}</div>
                </div>
                {i < PHASES.length - 1 && (
                  <div
                    style={{
                      flexGrow: 1,
                      minWidth: 24,
                      height: 5,
                      margin: "0 16px",
                      background: state === "next" ? "#d9d8e8" : BRAND.violet,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    ),
    size,
  );
}
