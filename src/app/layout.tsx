import type { Metadata } from "next";
import { Inter, Playfair_Display, Dancing_Script } from "next/font/google";
import Navigation from "@/components/Navigation";
import CustomCursor from "@/components/CustomCursor";
import Background from "@/components/Background";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" });

export const metadata: Metadata = {
  title: "A little birthday universe",
  description: "Letters, memories and little moments, just for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${dancingScript.variable} antialiased min-h-screen flex flex-col`}>
        <Background />
        <CustomCursor />
        <Navigation />
        {children}
      </body>
    </html>
  );
}
