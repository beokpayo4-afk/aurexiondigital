import { useParams } from "react-router-dom";

import { CourseDetails } from "@/components/academy/CourseDetails";
import { PageIntro } from "@/components/layout/PageIntro";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getCourseOutline } from "@/services/academyService";
import { courseData } from "@/seo/structuredData";

export function AcademyCoursePage() {
  const { slug = "" } = useParams();
  const course = useAsyncData(() => getCourseOutline(slug), [slug]);
  usePageTitle(course.data?.title ?? "Course", course.data?.summary || "Published Academy course.");

  if (course.loading) {
    return (
      <Container className="py-20">
        <LoadingState label="Loading course" />
      </Container>
    );
  }
  if (course.error) {
    return (
      <Container className="py-20">
        <ErrorState message={course.error} onRetry={course.reload} />
      </Container>
    );
  }
  if (!course.data) {
    return (
      <Container className="py-20">
        <EmptyState
          title="This course is not published"
          description="It appears here when the Academy publishes it."
          action={
            <Button to="/academy/courses" tone="light">
              All courses
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <>
      <JsonLd
        data={courseData(window.location.origin, {
          title: course.data.title,
          slug: course.data.slug,
          summary: course.data.summary,
          description: course.data.description,
          image: course.data.thumbnail_url,
          price: course.data.price_amount,
          currency: course.data.currency,
        })}
      />
      <PageIntro
        eyebrow="Aurexion Academy"
        title={course.data.title}
        description={course.data.summary ?? "Published Academy course."}
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Academy", to: "/academy" },
          { label: "Courses", to: "/academy/courses" },
          { label: course.data.title },
        ]}
      />
      <section className="bg-paper">
        <Container className="py-16 sm:py-20">
          <CourseDetails course={course.data} />
        </Container>
      </section>
    </>
  );
}
