import { Link } from "react-router-dom";

import { CourseGrid } from "@/components/academy/CourseGrid";
import { ActivityList } from "@/components/company/ActivityList";
import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { AREAS } from "@/constants/company";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listCourses } from "@/services/catalogService";

export function AcademyPage() {
  usePageTitle("Academy", "Courses, workshops, and training from Aurexion Academy.");
  const courses = useAsyncData(() => listCourses(), []);
  const { isAuthenticated } = useAuth();
  const activities = AREAS.find((area) => area.id === "education-academy")?.activities ?? [];

  return (
    <>
      <PageIntro
        eyebrow="Aurexion Academy"
        title="Aurexion Academy"
        description="Courses are listed with their prices. Lessons open after payment and enrollment."
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20">
          <div className="flex flex-wrap gap-4">
            <Button to="/academy/courses" tone="light">
              All courses
            </Button>
            {isAuthenticated ? (
              <Button to="/academy/dashboard" variant="secondary" tone="light">
                Student dashboard
              </Button>
            ) : (
              <Button to="/academy/login" variant="secondary" tone="light">
                Student login
              </Button>
            )}
          </div>
          <div className="mt-10">
            {courses.loading ? <LoadingState label="Loading courses" /> : null}
            {courses.error ? <ErrorState message={courses.error} onRetry={courses.reload} /> : null}
            {!courses.loading && !courses.error && courses.data?.items.length === 0 ? (
              <EmptyState title="No courses listed yet" description="Check back, or ask about training from the contact page." />
            ) : null}
            {courses.data && courses.data.items.length > 0 ? <CourseGrid courses={courses.data.items} /> : null}
          </div>
          <h2 className="mt-16 text-2xl font-semibold">Training the company offers</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/70">These are areas of training, not the names of courses.</p>
          <div className="mt-8">
            <ActivityList activities={activities} />
          </div>
          {!isAuthenticated ? (
            <p className="mt-10 text-sm">
              <Link to="/academy/register" className="font-semibold text-champagne-deep">
                Create a student account
              </Link>
            </p>
          ) : null}
        </Container>
      </section>
    </>
  );
}
