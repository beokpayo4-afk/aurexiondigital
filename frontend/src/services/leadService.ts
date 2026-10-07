import { z } from "zod";

import { api } from "@/api/client";
import { CAMPAIGN_CHANNELS } from "@/constants/campaign";
import { AREAS } from "@/constants/company";
import { CONTACT_CHANNELS, CONTACT_INTERESTS } from "@/constants/enquiry";

const areaIds = AREAS.map((area) => area.id) as [string, ...string[]];

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(200),
  company_name: z.string().trim().min(1, "Enter the company name.").max(200),
  phone: z
    .string()
    .trim()
    .min(1, "Enter a phone number.")
    .max(32)
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Enter a valid phone number."),
  email: z.string().trim().email("Enter a valid email."),
  subject: z.string().trim().min(1, "Enter a subject.").max(200),
  promote: z.string().trim().min(1, "Describe what you want to promote or build."),
  interest: z.enum(CONTACT_INTERESTS, { errorMap: () => ({ message: "Choose Marketing, Technology, Education, or Other." }) }),
  channel: z.enum(CONTACT_CHANNELS, { errorMap: () => ({ message: "Choose Online, Offline, or Both." }) }),
  budget: z.string().trim().min(1, "Enter a budget.").max(80),
  target_location: z.string().trim().min(1, "Enter the target location.").max(200),
  message: z.string().trim().min(1, "Enter a message."),
});

export const serviceEnquirySchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(200),
  company_name: z.string().trim().max(200).optional(),
  phone: z.string().trim().min(1, "Enter a phone number.").max(32),
  email: z.string().trim().email("Enter a valid email."),
  message: z.string().trim().min(1, "Describe the service you need."),
});

export const quoteSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(32).optional(),
  business_area: z.enum(areaIds, { errorMap: () => ({ message: "Choose a business area." }) }),
  service_id: z.string().optional(),
  requirements: z.string().trim().min(1, "Describe the work."),
});

const channelValues = CAMPAIGN_CHANNELS;

export const campaignQuoteSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200),
  organization: z.string().trim().min(1, "Enter the company or brand.").max(200),
  phone: z.string().trim().min(1, "Enter a phone number.").max(32),
  email: z.string().trim().email("Enter a valid email."),
  product_service: z.string().trim().min(1, "Enter the product or service.").max(200),
  target_location: z.string().trim().min(1, "Enter the target location.").max(200),
  target_audience: z.string().trim().min(1, "Enter the target audience."),
  estimated_budget: z.string().trim().min(1, "Enter the estimated budget.").max(80),
  channels: z.array(z.enum(channelValues)).min(1, "Select at least one channel."),
  requirements: z.string().trim().min(1, "Describe the marketing requirement."),
});

export type ContactValues = z.infer<typeof contactSchema>;
export type ServiceEnquiryValues = z.infer<typeof serviceEnquirySchema>;
export type QuoteValues = z.infer<typeof quoteSchema>;
export type CampaignQuoteValues = z.infer<typeof campaignQuoteSchema>;

export type QuoteRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  product_service: string | null;
  target_location: string | null;
  target_audience: string | null;
  estimated_budget: string | null;
  channels: string[];
  requirements: string;
  status: string;
  response_message: string | null;
  response_amount: string | null;
  created_at: string;
};

export type ServiceEnquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  message: string;
  notes: string | null;
  status: string;
  service_id: string | null;
  service_name: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  created_at: string;
};

export async function submitContact(values: ContactValues): Promise<void> {
  await api.post("/contact", {
    name: values.name,
    company_name: values.company_name,
    phone: values.phone,
    email: values.email,
    promote: values.promote,
    interest: values.interest,
    channel: values.channel,
    budget: values.budget,
    target_location: values.target_location,
    subject: values.subject,
    message: values.message,
    source_path: "/contact",
  });
}

export async function submitServiceEnquiry(values: ServiceEnquiryValues, serviceId?: string | null): Promise<void> {
  await api.post("/enquiries", {
    name: values.name,
    company_name: values.company_name?.trim() || null,
    phone: values.phone,
    email: values.email,
    message: values.message,
    service_id: serviceId || null,
  });
}

export async function listEnquiries(params: { page: number; q?: string; status?: string; serviceId?: string }): Promise<{
  items: ServiceEnquiry[];
  page: number;
  page_size: number;
  total: number;
}> {
  const response = await api.get<{ items: ServiceEnquiry[]; page: number; page_size: number; total: number }>("/enquiries", {
    params: {
      page: params.page,
      page_size: 10,
      sort: "-created_at",
      q: params.q || undefined,
      status: params.status || undefined,
      service_id: params.serviceId || undefined,
    },
  });
  return response.data;
}

export async function updateEnquiry(
  id: string,
  values: { status: string; assigned_to_user_id: string | null; notes: string },
): Promise<ServiceEnquiry> {
  const response = await api.put<ServiceEnquiry>(`/enquiries/${id}`, {
    status: values.status,
    assigned_to_user_id: values.assigned_to_user_id,
    notes: values.notes.trim() || null,
  });
  return response.data;
}

export async function submitCampaignQuote(values: CampaignQuoteValues): Promise<void> {
  await api.post("/quote-requests", {
    name: values.name,
    email: values.email,
    phone: values.phone,
    organization: values.organization,
    product_service: values.product_service,
    target_location: values.target_location,
    target_audience: values.target_audience,
    estimated_budget: values.estimated_budget,
    channels: values.channels,
    requirements: values.requirements,
    business_area: "marketing-advertising",
  });
}

export async function listQuoteRequests(params: { page: number; q?: string; status?: string } = { page: 1 }): Promise<{
  items: QuoteRequest[];
  page: number;
  page_size: number;
  total: number;
}> {
  const response = await api.get<{ items: QuoteRequest[]; page: number; page_size: number; total: number }>("/quote-requests", {
    params: {
      page: params.page,
      page_size: 10,
      sort: "-created_at",
      q: params.q || undefined,
      status: params.status || undefined,
    },
  });
  return response.data;
}

export async function updateQuoteRequest(
  id: string,
  values: { status: string; response_message?: string; response_amount?: string },
): Promise<QuoteRequest> {
  const response = await api.put<QuoteRequest>(`/quote-requests/${id}`, {
    status: values.status,
    response_message: values.response_message || null,
    response_amount: values.response_amount || null,
  });
  return response.data;
}

export async function submitQuote(values: QuoteValues): Promise<void> {
  await api.post("/quote-requests", {
    name: values.name,
    email: values.email,
    phone: values.phone || null,
    business_area: values.business_area,
    service_id: values.service_id || null,
    requirements: values.requirements,
  });
}
