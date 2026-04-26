"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { GamiLogo } from "@/components/gami-logo";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur", // D-06: validate on blur (and on submit by default)
  });

  async function onSubmit(values: SignInValues) {
    setSubmitting(true);
    const result = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    setSubmitting(false);

    if (result.error) {
      const code = result.error.code ?? "";
      if (code === "INVALID_EMAIL_OR_PASSWORD" || code === "USER_NOT_FOUND") {
        form.setError("password", { message: "Incorrect email or password" });
        form.setFocus("password");
      } else {
        form.setError("root", {
          message: "Something went wrong. Please try again.",
        });
      }
      return;
    }
    router.push("/");
  }

  async function handleGuestSignIn() {
    setGuestSubmitting(true);
    const result = await authClient.signIn.anonymous();
    setGuestSubmitting(false);
    if (result.error) {
      form.setError("root", {
        message: "Guest sign-in failed. Please try again.",
      });
      return;
    }
    router.push("/");
  }

  const rootError = form.formState.errors.root?.message;

  return (
    <>
      <GamiLogo size="lg" />
      <Card className="w-full max-w-sm rounded-xl shadow-sm border border-black/[0.08] bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              aria-label="Sign in form"
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoFocus
                        aria-label="Email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        aria-label="Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {rootError ? (
                <p role="alert" className="text-xs text-destructive">
                  {rootError}
                </p>
              ) : null}
              <Button
                type="submit"
                size="lg"
                className="w-full min-h-[44px]"
                disabled={submitting || guestSubmitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-sm text-center">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-primary hover:underline inline-flex items-center min-h-[44px]"
            >
              Sign up
            </Link>
          </p>
          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={submitting || guestSubmitting}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center min-h-[44px] gap-1"
          >
            {guestSubmitting ? (
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            ) : null}
            Play as Guest
          </button>
        </CardFooter>
      </Card>
    </>
  );
}
