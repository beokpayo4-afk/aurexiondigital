import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginValues } from "@/services/authSchemas";
import { canOpenAdmin } from "@/types/auth";
import { safeAppPath } from "@/utils/safeUrl";

export function LoginForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setNotice(null);
    try {
      const signedIn = await signIn(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from;
      const fallback = location.pathname.startsWith("/academy")
        ? "/academy/dashboard"
        : canOpenAdmin(signedIn.roles)
          ? "/admin"
          : "/account";
      navigate(safeAppPath(from, fallback), { replace: true });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign-in failed.");
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormInput label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
      <FormInput
        label="Password"
        type="password"
        autoComplete="current-password"
        {...register("password")}
        error={errors.password?.message}
      />
      {notice ? (
        <p role="alert" className="text-sm text-red-800">
          {notice}
        </p>
      ) : null}
      <Button type="submit" tone="light" disabled={isSubmitting}>
        {isSubmitting ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
