import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomQuotePage } from "@/pages/CustomQuotePage";
import { submitCampaignQuote } from "@/services/leadService";

vi.mock("@/services/leadService", async () => {
  const actual = await vi.importActual<typeof import("@/services/leadService")>("@/services/leadService");
  return { ...actual, submitCampaignQuote: vi.fn() };
});

describe("custom quote", () => {
  beforeEach(() => {
    vi.mocked(submitCampaignQuote).mockResolvedValue();
  });

  it("asks for a channel before sending the request", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CustomQuotePage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Request Custom Quote" }));
    expect(await screen.findByText("Select at least one channel.")).toBeInTheDocument();
    expect(submitCampaignQuote).not.toHaveBeenCalled();
  });

  it("records a completed campaign request", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CustomQuotePage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("checkbox", { name: "SEO" }));
    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.type(screen.getByLabelText("Company/Brand"), "Ada Co");
    await user.type(screen.getByLabelText("Phone"), "9153940559");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Product/Service"), "Launch");
    await user.type(screen.getByLabelText("Target Location"), "Bhopal");
    await user.type(screen.getByLabelText("Target Audience"), "Local businesses");
    await user.type(screen.getByLabelText("Estimated Budget"), "To be discussed");
    await user.type(screen.getByLabelText("Marketing Requirement"), "A short campaign.");
    await user.click(screen.getByRole("button", { name: "Request Custom Quote" }));
    expect(await screen.findByRole("heading", { name: "Request received." })).toBeInTheDocument();
    expect(submitCampaignQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ada",
        channels: ["SEO"],
        requirements: "A short campaign.",
      }),
    );
  });
});