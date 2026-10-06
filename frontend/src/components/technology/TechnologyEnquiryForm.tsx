import { ServiceEnquiryForm } from "@/components/enquiries/ServiceEnquiryForm";

type TechnologyEnquiryFormProps = {
  serviceId?: string | null;
  defaultMessage?: string;
  submitLabel?: string;
};

export function TechnologyEnquiryForm({
  serviceId,
  defaultMessage = "",
  submitLabel = "Send project enquiry",
}: TechnologyEnquiryFormProps) {
  return (
    <ServiceEnquiryForm
      serviceId={serviceId}
      defaultMessage={defaultMessage}
      submitLabel={submitLabel}
      messageLabel="Project"
      successDetail="The project enquiry has been recorded. It does not take payment."
    />
  );
}
