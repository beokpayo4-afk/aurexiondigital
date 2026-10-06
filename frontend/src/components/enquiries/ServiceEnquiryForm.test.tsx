import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceEnquiryForm } from "@/components/enquiries/ServiceEnquiryForm";
import { submitServiceEnquiry } from "@/services/leadService";

vi.mock("@/services/leadService", async () => {
  const actual = await vi.importActual<typeof import("@/services/leadService")>("@/services/leadService");
  return { ...actual, submitServiceEnquiry: vi.fn() };
});

describe("service enquiry form", () => {
  beforeEach(() => {
    vi.mocked(submitServiceEnquiry).mockResolvedValue();
  });

  it("blocks an empty enquiry", async () => {
    const user = userEvent.setup();
    render(<ServiceEnquiryForm serviceId="service-1" serviceName="Growth" />);
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));
    expect(await screen.findByText("Enter your full name.")).toBeInTheDocument();
    expect(submitServiceEnquiry).not.toHaveBeenCalled();
  });

  it("submits a completed enquiry for the selected service", async () => {
    const user = userEvent.setup();
    render(<ServiceEnquiryForm serviceId="service-1" serviceName="Growth" />);
    await user.type(screen.getByLabelText("Full Name"), "Ada");
    await user.type(screen.getByLabelText("Phone Number"), "9153940559");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Message"), "Need a campaign.");
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));
    expect(await screen.findByRole("heading", { name: "Enquiry received." })).toBeInTheDocument();
    expect(submitServiceEnquiry).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ada", email: "ada@example.com", message: "Need a campaign." }),
      "service-1",
    );
  });
});
