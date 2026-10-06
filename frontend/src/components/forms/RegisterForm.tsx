import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterValues } from "@/services/authSchemas";

export function RegisterForm() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterValues) => {
    setNotice(null);
    try {
      await registerAccount(values);
      const from = (location.state as { from?: string } | null)?.from;
      const fallback = location.pathname.startsWith("/academy") ? "/academy/dashboard" : "/account";
      navigate(from && from.startsWith("/") ? from : fallback, { replace: true });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Registration failed.");
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormInput label="Name" autoComplete="name" {...register("fullName")} error={errors.fullName?.message} />
      <FormInput label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
      <FormInput
        label="Password"
        type="password"
        autoComplete="new-password"
        {...register("password")}
        error={errors.password?.message}
      />
      {notice ? (
        <p role="alert" className="text-sm text-red-800">
          {notice}
        </p>
      ) : null}
      <Button type="submit" tone="light" disabled={isSubmitting}>
        {isSubmitting ? "Creating account" : "Create account"}
      </Button>
    </form>
  );
}
