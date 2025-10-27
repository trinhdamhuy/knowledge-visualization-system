"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    email: z.email({
      message: t("emailRequired"),
    }),
    password: z.string().min(1, {
      message: t("passwordRequired"),
    }),
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async (values) => {
      onSubmit(values.value);
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        if (result.error === "Configuration") {
          toast.error(t("emailNotVerified"));
        } else {
          toast.error(t("loginFailed"));
        }
      } else {
        toast.success(t("loginSuccess"));
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error(t("loginError"));
    } finally {
      setIsLoading(false);
    }
  }

  // Googleログイン処理
  const handleGoogleLogin = async () => {
    try {
      await signIn("google");
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl font-bold text-center text-primary">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-center text-xs sm:text-sm text-muted-foreground">
          {t("subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-3 sm:space-y-4"
        >
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      {t("email")}
                      <span className="text-red-500 text-xs">*</span>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="m@example.com"
                      disabled={isLoading}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="password">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor={field.name}>
                        {t("password")}
                        <span className="text-red-500 text-xs">*</span>
                      </FieldLabel>
                      <Link
                        href="/reset-password"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {t("forgotPassword")}
                      </Link>
                    </div>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isLoading}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("loginLoading") : t("loginButton")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex items-center justify-center text-xs uppercase">
                <span className="bg-card px-2 text-center text-muted-foreground">
                  {t("or")}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full"
            >
              <FcGoogle />
              {t("googleLogin")}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-center text-xs sm:text-sm">
        <span>
          {t("noAccount")} {""}
          <Link href="/sign-up" className="text-blue-500 hover:underline">
            {t("signUp")}
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
