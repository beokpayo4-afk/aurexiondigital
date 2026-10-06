import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { CourseGrid } from "@/components/academy/CourseGrid";
import type { Course } from "@/types/catalog";

const course: Course = {
  id: "course-1",
  business_area: "education-academy",
  slug: "marketing-starter",
  title: "Marketing Starter",
  summary: "A published course.",
  level: "Starter",
  duration_label: "4 weeks",
  thumbnail_url: null,
  price_amount: "1500.00",
  currency: "INR",
};

describe("course listing", () => {
  it("lists the course title, price, and course link", () => {
    render(
      <MemoryRouter>
        <CourseGrid courses={[course]} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Marketing Starter" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View course" })).toHaveAttribute("href", "/academy/course/marketing-starter");
    expect(screen.getByText(/1,500/)).toBeInTheDocument();
  });
});
