import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { Textarea } from "@/components/ui/Textarea";
import { serviceEnquirySchema, submitServiceEnquiry, type ServiceEnquiryValues } from "@/services/leadService";
import { apiErrorMessage } from "@/utils/apiError";

type ServiceEnquiryFormProps = {
  serviceId?: string | null;
  serviceName?: string;
  defaultMessage?: string;
  submitLabel?: string;
  successDetail?: string;
  messageLabel?: string;
};

export function ServiceEnquiryForm({
  serviceId,
  serviceName,
  defaultMessage = "",
  submitLabel = "Send enquiry",
  successDetail,
  messageLabel = "Message",
}: ServiceEnquiryFormProps) {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServiceEnquiryValues>({
    resolver: zodResolver(serviceEnquirySchema),
    defaultValues: { message: defaultMessage, company_name: "" },
  });

  const onSubmit = async (values: ServiceEnquiryValues) => {
    setFormError(null);
    try {
      await submitServiceEnquiry(values, serviceId);
      setSent(true);
    } catch (error) {
      setFormError(apiErrorMessage(error, "The enquiry could not be sent."));
    }
  };

  if (sent) {
    const detail =
      successDetail ??
      (serviceName
        ? `The enquiry for ${serviceName} has been recorded.`
        : "The service enquiry has been recorded.");
    return (
      <div className="rounded-xl border border-line bg-white p-8 shadow-card" role="status">
        <h3 className="font-display text-4xl">Enquiry received.</h3>
        <p className="mt-4 text-sm leading-6 text-ink/75">{detail}</p>
      </div>
    );
  }

  return (
    <form className="max-w-xl space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormInput label="Full Name" autoComplete="name" {...register("name")} error={errors.name?.message} />
      <FormInput label="Company Name" autoComplete="organization" {...register("company_name")} error={errors.company_name?.message} />
      <FormInput label="Phone Number" type="tel" autoComplete="tel" {...register("phone")} error={errors.phone?.message} />
      <FormInput label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
      <Textarea label={messageLabel} {...register("message")} error={errors.message?.message} />
      {formError ? (
        <p role="alert" className="text-sm text-red-800">
          {formError}
        </p>
      ) : null}
      <Button type="submit" tone="light" disabled={isSubmitting}>
        {isSubmitting ? "Sending" : submitLabel}
      </Button>
    </form>
  );
}
