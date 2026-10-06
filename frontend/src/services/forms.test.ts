import { describe, expect, it } from "vitest";

import { loginSchema } from "@/services/authSchemas";
import { campaignQuoteSchema, contactSchema, serviceEnquirySchema } from "@/services/leadService";

describe("form validation", () => {
  it("rejects a short password and an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe("Enter a valid email.");
      expect(result.error.flatten().fieldErrors.password?.[0]).toBe("Password must be at least 8 characters.");
    }
  });

  it("requires the contact fields used on the public form", () => {
    const result = contactSchema.safeParse({
      name: "",
      company_name: "",
      phone: "",
      email: "ada@example.com",
      promote: "",
      interest: "Finance",
      channel: "Online",
      budget: "",
      target_location: "",
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete service enquiry", () => {
    const result = serviceEnquirySchema.safeParse({
      name: "Ada",
      phone: "9153940559",
      email: "ada@example.com",
      message: "Need a website.",
    });
    expect(result.success).toBe(true);
  });

  it("requires at least one campaign channel", () => {
    const result = campaignQuoteSchema.safeParse({
      name: "Ada",
      organization: "Ada Co",
      phone: "9153940559",
      email: "ada@example.com",
      product_service: "Launch",
      target_location: "Bhopal",
      target_audience: "Local businesses",
      estimated_budget: "To be discussed",
      channels: [],
      requirements: "A short campaign.",
    });
    expect(result.success).toBe(false);
  });
});
