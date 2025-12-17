import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { Language } from "@/generated/prisma/client";

async function getCookieData() {
  const cookieStore = await cookies();
  const cookieData = cookieStore.getAll();
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve(cookieData);
    }, 1000)
  );
}
export default getRequestConfig(async () => {
  let locale: Language = Language.en;

  try {
    const cookieStore = await getCookieData();
    const localeCookie = cookieStore as unknown as Record<
      string,
      string
    >["locale"] as Language;
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
