import { SiteHeader } from "@/components/layout/SiteHeader";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { GrainEffect } from "@/components/effects/GrainEffect";
import { CustomCursor } from "@/components/effects/CustomCursor";
import { EntranceAnimation } from "@/components/effects/EntranceAnimation";
import { WelcomeModal } from "@/components/effects/WelcomeModal";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "1000냥 전시회",
  description: "전공에서 발견한 예술을 전시하다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">
        <AuthProvider>
          <EntranceAnimation />
          <WelcomeModal />
          <GrainEffect />
          <CustomCursor />
          <SiteHeader />
          <div className="flex min-h-[calc(100vh-4rem)] flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
