"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "./theme-provider";
import NextTopLoader from "nextjs-toploader";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useLanguage } from "../hooks/use-language";
import { useLocale } from "next-intl";
import { TeamProvider } from "../contexts/team-context";
import { useTeamStore } from "../stores/team-store";
import { teamKeys } from "@/hooks/use-team";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
    mutations: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      },
    },
  },
});

const TeamAndLanguageSync = () => {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const { clearCurrentTeam } = useTeamStore();
  const changeLanguage = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") {
      clearCurrentTeam();
    }
    if (session && locale !== session.user.language) {
      changeLanguage(session.user.language);
    }
  }, [session, status, locale, changeLanguage, clearCurrentTeam]);

  return null;
};

const DefaultProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <TeamProvider>
            <NextTopLoader
              color="#142850"
              initialPosition={0.08}
              crawlSpeed={200}
              height={3}
              crawl={true}
              showSpinner={false}
              easing="ease"
              speed={200}
              shadow="0 0 10px #2299DD,0 0 5px #2299DD"
              zIndex={1600}
              showAtBottom={false}
            />
            <TeamAndLanguageSync />
            {children}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              duration={2000}
            />
          </TeamProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default DefaultProviders;
