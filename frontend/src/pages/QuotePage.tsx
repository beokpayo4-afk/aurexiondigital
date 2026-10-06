import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FormInput } from "@/components/ui/FormInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AREAS, areaById } from "@/constants/company";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listServices } from "@/services/catalogService";
import { quoteSchema, submitQuote, type QuoteValues } from "@/services/leadService";
import { apiErrorMessage } from "@/utils/apiError";

export function QuotePage() {
  usePageTitle("Custom Quote");
  const [params] = useSearchParams();
  const initialArea = areaById(params.get("area"))?.id ?? "";
  const initialService = params.get("service") ?? "";
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const services = useAsyncData(() => listServices(), []);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { business_area: initialArea, service_id: initialService },
  });
  const selectedArea = watch("business_area");
  const serviceOptions = (services.data?.items ?? [])
    .filter((service) => !selectedArea || service.business_area === selectedArea)
    .map((service) => ({ value: service.id, label: service.name }));

  const onSubmit = async (values: QuoteValues) => {
    setFormError(null);
    try {
      await submitQuote(values);
      setSent(true);
    } catch (error) {
      setFormError(apiErrorMessage(error, "The quote request could not be sent."));
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Custom Quote"
        title="Request a response."
        description="Choose a business area and describe the work. A published service can be attached when one is available."
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20">
          {sent ? (
            <div className="max-w-xl rounded-xl border border-line bg-white p-8 shadow-card" role="status">
              <h2 className="font-display text-4xl">Request received.</h2>
              <p className="mt-4 text-sm leading-6 text-ink/75">The quote request has been recorded.</p>
            </div>
          ) : (
            <form className="max-w-xl space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormInput label="Name" autoComplete="name" {...register("name")} error={errors.name?.message} />
              <FormInput label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
              <FormInput label="Phone" type="tel" autoComplete="tel" {...register("phone")} error={errors.phone?.message} />
              <Select
                label="Business area"
                placeholder="Choose an area"
                options={AREAS.map((area) => ({ value: area.id, label: area.title }))}
                {...register("business_area")}
                error={errors.business_area?.message}
              />
              <Select
                label="Service"
                placeholder={services.loading ? "Loading services" : "No specific service"}
                options={serviceOptions}
                {...register("service_id")}
                error={errors.service_id?.message}
              />
              <Textarea label="Requirements" {...register("requirements")} error={errors.requirements?.message} />
              {formError ? (
                <p role="alert" className="text-sm text-red-800">
                  {formError}
                </p>
              ) : null}
              <Button type="submit" tone="light" disabled={isSubmitting}>
                {isSubmitting ? "Sending" : "Submit request"}
              </Button>
            </form>
          )}
        </Container>
      </section>
    </>
  );
}
