import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FormInput } from "@/components/ui/FormInput";
import { Textarea } from "@/components/ui/Textarea";
import { CAMPAIGN_CHANNELS } from "@/constants/campaign";
import { usePageTitle } from "@/hooks/usePageTitle";
import { campaignQuoteSchema, submitCampaignQuote, type CampaignQuoteValues } from "@/services/leadService";
import { apiErrorMessage } from "@/utils/apiError";

export function CustomQuotePage() {
  usePageTitle("Custom Quote", "Build a marketing campaign and request a quote.");
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CampaignQuoteValues>({
    resolver: zodResolver(campaignQuoteSchema),
    defaultValues: { channels: [] },
  });

  const onSubmit = async (values: CampaignQuoteValues) => {
    setFormError(null);
    try {
      await submitCampaignQuote(values);
      setSent(true);
    } catch (error) {
      setFormError(apiErrorMessage(error, "The quote request could not be sent."));
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Custom Quote"
        title="Build Your Own Marketing Campaign."
        description="Select the channels you want and describe the campaign. This sends a quote request. It does not confirm a price or a media placement."
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20">
          {sent ? (
            <div className="max-w-2xl rounded-xl border border-line bg-white p-8 shadow-card" role="status">
              <h2 className="font-display text-4xl">Request received.</h2>
              <p className="mt-4 text-sm leading-6 text-ink/75">
                The custom quote request has been recorded. A response will use the details you submitted.
              </p>
            </div>
          ) : (
            <form className="max-w-3xl space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
              <fieldset>
                <legend className="text-sm font-medium text-ink">Channels</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {CAMPAIGN_CHANNELS.map((channel) => (
                    <label key={channel} className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-white px-3 text-sm">
                      <input type="checkbox" value={channel} {...register("channels")} />
                      {channel}
                    </label>
                  ))}
                </div>
                {errors.channels?.message ? (
                  <p role="alert" className="mt-2 text-sm text-red-800">
                    {errors.channels.message}
                  </p>
                ) : null}
              </fieldset>
              <div className="grid gap-5 md:grid-cols-2">
                <FormInput label="Name" autoComplete="name" {...register("name")} error={errors.name?.message} />
                <FormInput label="Company/Brand" autoComplete="organization" {...register("organization")} error={errors.organization?.message} />
                <FormInput label="Phone" type="tel" autoComplete="tel" {...register("phone")} error={errors.phone?.message} />
                <FormInput label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
                <FormInput label="Product/Service" {...register("product_service")} error={errors.product_service?.message} />
                <FormInput label="Target Location" {...register("target_location")} error={errors.target_location?.message} />
                <FormInput label="Target Audience" {...register("target_audience")} error={errors.target_audience?.message} />
                <FormInput label="Estimated Budget" {...register("estimated_budget")} error={errors.estimated_budget?.message} />
              </div>
              <Textarea label="Marketing Requirement" {...register("requirements")} error={errors.requirements?.message} />
              {formError ? (
                <p role="alert" className="text-sm text-red-800">
                  {formError}
                </p>
              ) : null}
              <Button type="submit" tone="light" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? "Sending request" : "Request Custom Quote"}
              </Button>
            </form>
          )}
        </Container>
      </section>
    </>
  );
}
