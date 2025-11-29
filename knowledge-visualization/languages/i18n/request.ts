import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { Language } from "@/generated/prisma/client";

export default getRequestConfig(async () => {
  let locale: Language = Language.en;

  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("locale")?.value;
    if (
      localeCookie &&
      Object.values(Language).includes(localeCookie as Language)
    ) {
      locale = localeCookie as Language;
    }
  } catch (error) {
    console.error(error);
  }

  return {
    locale: locale.toString(),
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
