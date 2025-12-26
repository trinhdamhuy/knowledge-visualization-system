import type { Metadata } from "next";
import { Noto_Sans_JP, Roboto } from "next/font/google";
import "./globals.css";
import DefaultProviders from "../providers/default-provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-mono",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-sans",
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
      <body className={`${roboto.variable} ${notoSansJP.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <DefaultProviders>
            <main
              className="min-h-screen flex flex-col items-center justify-center"
              style={{
                WebkitUserSelect: "none",
                userSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                WebkitTouchCallout: "none",
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
