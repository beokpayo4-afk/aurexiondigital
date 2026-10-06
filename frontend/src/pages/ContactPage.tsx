import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ContactDetails } from "@/components/company/ContactDetails";
import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FormInput } from "@/components/ui/FormInput";
import { Textarea } from "@/components/ui/Textarea";
import { CONTACT_CHANNELS, CONTACT_INTERESTS } from "@/constants/enquiry";
import { usePageTitle } from "@/hooks/usePageTitle";
import { contactSchema, submitContact, type ContactValues } from "@/services/leadService";
import { apiErrorMessage } from "@/utils/apiError";

export function ContactPage() {
  usePageTitle("Contact", "Send a message to Aurexion Digital.");
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactValues) => {
    setFormError(null);
    try {
      await submitContact(values);
      setSent(true);
    } catch (error) {
      setFormError(apiErrorMessage(error, "The message could not be sent."));
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Contact"
        description="Tell us what you want to promote or build. For a priced campaign, use Custom Quote."
      />
      <section className="bg-paper">
        <Container className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-2xl font-semibold">Reach us</h2>
            <div className="mt-6">
              <ContactDetails />
            </div>
          </div>
          {sent ? (
            <div className="rounded-xl border border-line bg-white p-8 shadow-card" role="status">
              <h2 className="text-2xl font-semibold">Message received.</h2>
              <p className="mt-4 text-sm leading-6 text-ink/75">
                Thanks. We have your message and will reply on the phone or email you entered.
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput label="Full Name" autoComplete="name" {...register("name")} error={errors.name?.message} />
                <FormInput label="Company Name" autoComplete="organization" {...register("company_name")} error={errors.company_name?.message} />
                <FormInput label="Phone Number" type="tel" autoComplete="tel" {...register("phone")} error={errors.phone?.message} />
                <FormInput label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
              </div>
              <Textarea label="What do you want to promote/build?" {...register("promote")} error={errors.promote?.message} />
              <fieldset>
                <legend className="text-sm font-medium text-ink">Marketing / Technology / Education / Other</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {CONTACT_INTERESTS.map((interest) => (
                    <label key={interest} className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-white px-3 text-sm">
                      <input type="radio" value={interest} {...register("interest")} />
                      {interest}
                    </label>
                  ))}
                </div>
                {errors.interest?.message ? (
                  <p role="alert" className="mt-2 text-sm text-red-800">
                    {errors.interest.message}
                  </p>
                ) : null}
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium text-ink">Online / Offline / Both</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {CONTACT_CHANNELS.map((channel) => (
                    <label key={channel} className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-white px-3 text-sm">
                      <input type="radio" value={channel} {...register("channel")} />
                      {channel}
                    </label>
                  ))}
                </div>
                {errors.channel?.message ? (
                  <p role="alert" className="mt-2 text-sm text-red-800">
                    {errors.channel.message}
                  </p>
                ) : null}
              </fieldset>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput label="Budget" {...register("budget")} error={errors.budget?.message} />
                <FormInput label="Target Location" {...register("target_location")} error={errors.target_location?.message} />
              </div>
              <Textarea label="Message" {...register("message")} error={errors.message?.message} />
              {formError ? (
                <p role="alert" className="text-sm text-red-800">
                  {formError}
                </p>
              ) : null}
              <Button type="submit" tone="light" disabled={isSubmitting}>
                {isSubmitting ? "Sending" : "Send message"}
              </Button>
            </form>
          )}
        </Container>
      </section>
    </>
  );
}
