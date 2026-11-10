import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gold Trading Pro",
  description: "XAU/USD analysis dashboard and risk calculator"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
