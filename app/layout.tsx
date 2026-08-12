import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "軌道脈動｜火箭與低軌衛星追蹤";
const description =
  "追蹤 SpaceX、Rocket Lab、Blue Origin、Amazon Leo、AST SpaceMobile、VSAT、FLY、VOYG 與 IRDM 的發射、部署、異常與里程碑。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
  title: "軌道脈動｜火箭與低軌衛星追蹤",
    description,
    openGraph: {
      title,
      description,
      url: origin,
      siteName: "軌道脈動",
      locale: "zh_TW",
      type: "website",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1732,
          height: 908,
          alt: "ORBITAL PULSE 火箭與低軌衛星追蹤",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
