import type { Metadata } from "next";
import { Inter, Merriweather, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import DefaultProviders from "../providers/default-provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const merriweather = Merriweather({
  weight: ["300", "700", "900"],
  subsets: ["latin"],
  variable: "--font-merriweather",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "Knovion",
  description: "Knowledge Visualization Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${merriweather.variable} ${notoSansJP.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <DefaultProviders>
            <main
              className="min-h-screen flex flex-col items-center justify-center"
              style={{
                WebkitUserSelect: "none",
              }}
            >
              {children}
            </main>
          </DefaultProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
