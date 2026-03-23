import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google"; // Added Montserrat
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CAIP Dashboard",
  description: "Chamber for Agri Input Protection - Member Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased font-sans`} // Added Montserrat variable
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
