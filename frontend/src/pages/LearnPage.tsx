import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePageTitle } from "@/hooks/usePageTitle";

export function LearnPage() {
  usePageTitle("Your courses");

  return (
    <Container className="py-16 sm:py-20">
      <h1 className="font-display text-5xl">Your courses</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/75">Lesson material is available with an active enrollment.</p>
      <div className="mt-10">
        <EmptyState
          title="No enrollments yet"
          description="Published courses can be viewed in the Academy. Enrolled lessons will appear here."
        />
      </div>
    </Container>
  );
}
