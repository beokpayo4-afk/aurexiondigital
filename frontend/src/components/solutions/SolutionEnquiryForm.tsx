import { ServiceEnquiryForm } from "@/components/enquiries/ServiceEnquiryForm";

type SolutionEnquiryFormProps = {
  serviceId: string;
  serviceName: string;
};

export function SolutionEnquiryForm({ serviceId, serviceName }: SolutionEnquiryFormProps) {
  return <ServiceEnquiryForm serviceId={serviceId} serviceName={serviceName} />;
}
