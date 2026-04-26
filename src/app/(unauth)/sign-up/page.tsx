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

const signUpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur", // D-06: validate on blur (and on submit by default)
  });

  async function onSubmit(values: SignUpValues) {
    setSubmitting(true);
    const result = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.email, // username collected later in Phase 4
    });
    setSubmitting(false);

    if (result.error) {
      const code = result.error.code ?? "";
      if (code === "EMAIL_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS") {
        form.setError("email", {
          message: "An account with this email already exists",
        });
        form.setFocus("email");
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
          <CardTitle className="text-xl font-semibold">
            Create your account
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Start playing in seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              aria-label="Sign up form"
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
                        placeholder="8+ characters"
                        autoComplete="new-password"
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
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-sm text-center">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-primary hover:underline inline-flex items-center min-h-[44px]"
            >
              Sign in
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
