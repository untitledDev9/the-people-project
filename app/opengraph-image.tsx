import { ImageResponse } from "next/og";

export const alt = "The 5,000 People Project — No Introduction Needed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share image for pages that don't set their own (individual people do).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c0c0b",
          color: "#f3efe6",
          padding: 80,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, textTransform: "uppercase", color: "#cfc5b0" }}>
          No Introduction Needed
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 110, fontWeight: 700, lineHeight: 1.05 }}>The 5,000 People Project</div>
          <div style={{ marginTop: 28, width: 120, height: 6, background: "#b4532a" }} />
          <div style={{ marginTop: 28, fontSize: 38, color: "#cfc5b0" }}>
            5,000 people. 5,000 stories. One journey.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
