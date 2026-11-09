import type { Metadata } from "next";
import { Public_Sans, Sora } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const textos = Public_Sans({ subsets: ["latin"], variable: "--font-sans" });
const titulos = Sora({ subsets: ["latin"], variable: "--font-titulo", weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "NexRain - Monitoramento inteligente de alagamentos",
  description:
    "Visão computacional, previsão de chuva em tempo real e rotas que desviam de ruas alagadas em São Paulo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${textos.variable} ${titulos.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-260px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
