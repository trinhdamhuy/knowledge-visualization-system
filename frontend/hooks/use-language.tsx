"use client";

import { useCallback } from "react";
import Cookies from "js-cookie";
import { Language } from "@/generated/prisma/client";

export const useLanguage = () => {
  const changeLanguage = useCallback((locale: Language) => {
    Cookies.set("locale", locale);
    window.location.reload();
  }, []);

  return changeLanguage;
};
