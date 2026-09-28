import type { Metadata } from "next";
import { Castoro_Titling, Source_Sans_3 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"
import "./globals.css";

const castoroTitling = Castoro_Titling({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TradePilot",
  description: "Track real-time stock prices, get personalized alerts and explore detailed company insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${castoroTitling.variable} ${sourceSans.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
