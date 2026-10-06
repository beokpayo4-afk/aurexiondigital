import { CourseGrid } from "@/components/academy/CourseGrid";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listCourses } from "@/services/catalogService";

export function AcademyCoursesPage() {
  usePageTitle("Courses", "Published Aurexion Academy courses and prices.");
  const courses = useAsyncData(() => listCourses(), []);

  return (
    <>
      <PageIntro eyebrow="Aurexion Academy" title="Courses" description="Prices shown here are the published course prices." />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20">
          {courses.loading ? <LoadingState label="Loading courses" /> : null}
          {courses.error ? <ErrorState message={courses.error} onRetry={courses.reload} /> : null}
          {!courses.loading && !courses.error && courses.data?.items.length === 0 ? (
            <EmptyState title="No published courses" description="Courses appear here after they are published." />
          ) : null}
          {courses.data && courses.data.items.length > 0 ? <CourseGrid courses={courses.data.items} /> : null}
        </Container>
      </section>
    </>
  );
}
