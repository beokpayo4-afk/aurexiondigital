import { Suspense } from "react";
import { Link, Outlet } from "react-router-dom";

import logo from "@/assets/aurexion-logo.jpg";
import { PageFallback } from "@/components/routing/PageFallback";
import { StudentSidebar } from "@/components/academy/StudentSidebar";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/constants/site";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuth } from "@/hooks/useAuth";
import { listEnrollments } from "@/services/academyService";

export function AcademyLayout() {
  const { signOut } = useAuth();
  const enrollments = useAsyncData(() => listEnrollments(), []);
  const courses =
    enrollments.data
      ?.filter((item) => item.status === "active" || item.status === "completed")
      .map((item) => ({ id: item.course_id, title: item.title, to: `/academy/course/${item.course_id}/learn` })) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="surface-dark border-b border-night/10">
        <Container className="flex min-h-20 items-center justify-between gap-4">
          <Link to="/academy">
            <img src={logo} alt={SITE.shortName} width={168} height={48} className="h-12 w-auto max-w-[9rem]" />
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
            <Link to="/academy" className="text-night/75 hover:text-night">
              Academy
            </Link>
            <button type="button" className="min-h-11 text-night/75 hover:text-night" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </Container>
      </header>
      <Container className="grid flex-1 gap-10 py-10 lg:grid-cols-[16rem_1fr]">
        <aside className="surface-dark h-fit rounded-xl p-5">
          <StudentSidebar courses={courses} />
        </aside>
        <main id="main" className="min-w-0">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </Container>
    </div>
  );
}
