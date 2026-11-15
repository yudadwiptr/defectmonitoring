import { ImageResponse } from "next/og";
import { BRAND, BugMark } from "./brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.violet,
          borderRadius: 40,
        }}
      >
        <BugMark size={112} />
      </div>
    ),
    size,
  );
}
