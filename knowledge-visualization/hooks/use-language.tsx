"use client";

import Cookies from "js-cookie";
import { Language } from "@prisma/client";

export const useLanguage = () => {
  const setCookieLocale = (locale: Language) => {
    Cookies.set("locale", locale);
  };

  const changeLanguage = (locale: Language) => {
    setCookieLocale(locale);
    window.location.reload();
  };

  return changeLanguage;
};
