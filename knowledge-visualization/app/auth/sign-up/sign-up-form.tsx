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

export function SignUpForm() {
  const t = useTranslations("auth.sign-up");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z
    .object({
      username: z.string().min(2, {
        message: t("usernameRequired"),
      }),
      email: z.email({
        message: t("emailRequired"),
      }),
      password: z.string().min(6, {
        message: t("passwordRequired"),
      }),
      confirmPassword: z.string().min(6, {
        message: t("passwordRequired"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
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
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || t("signUpFailed"));
      } else {
        toast.success(t("signUpSuccess"));
        form.reset();
        router.push("/auth/login");
      }
    } catch {
      toast.error(t("signUpError"));
    } finally {
      setIsLoading(false);
    }
  }

  // Googleログイン処理
  const handleGoogleLogin = async () => {
    try {
      await signIn("google");
    } catch {
      toast.error(t("googlesignUpError"));
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
        <div className="h-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="flex flex-col gap-4 sm:gap-6"
          >
            <FieldGroup className="flex flex-col gap-3 sm:gap-4">
              <form.Field
                name="username"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t("username")}
                        <span className="text-red-500 text-xs">*</span>
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t("username")}
                        disabled={isLoading}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="email"
                children={(field) => {
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
                        placeholder={t("email")}
                        disabled={isLoading}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t("password")}
                        <span className="text-red-500 text-xs">*</span>
                      </FieldLabel>
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
              />

              <form.Field
                name="confirmPassword"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t("confirmPassword")}
                        <span className="text-red-500 text-xs">*</span>
                      </FieldLabel>
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
              />
            </FieldGroup>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("signUpLoading") : t("signUpButton")}
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
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <FcGoogle />
                <span>{t("googlesignUp")}</span>
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-center text-xs sm:text-sm">
        <span>
          {t("hasAccount")}
          <Link href="/auth/login" className="text-blue-500 hover:underline">
            {t("login")}
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
