import { Link } from "react-router-dom";

import { ProgressBar } from "@/components/academy/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listEnrollments } from "@/services/academyService";

export function StudentDashboard() {
  const enrollments = useAsyncData(() => listEnrollments(), []);

  if (enrollments.loading) {
    return <LoadingState label="Loading enrollments" />;
  }
  if (enrollments.error) {
    return <ErrorState message={enrollments.error} onRetry={enrollments.reload} />;
  }
  if (!enrollments.data || enrollments.data.length === 0) {
    return (
      <EmptyState
        title="No enrollments yet"
        description="Buy a published course to start. Access opens after payment succeeds."
        action={
          <Link to="/academy/courses" className="text-sm font-semibold text-champagne-deep">
            View courses
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-5">
      {enrollments.data.map((enrollment) => {
        const open = enrollment.status === "active" || enrollment.status === "completed";
        return (
          <li key={enrollment.enrollment_id} className="rounded-xl border border-line bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-3xl">{enrollment.title}</h2>
              <p className="text-sm capitalize text-ink/65">{enrollment.status}</p>
            </div>
            <div className="mt-4">
              <ProgressBar value={enrollment.progress_percent} />
              <p className="mt-2 text-sm text-ink/65">{enrollment.progress_percent}% complete</p>
            </div>
            {enrollment.certificate.enabled ? (
              <p className="mt-3 text-sm text-ink/75">
                {enrollment.certificate.number ? `Certificate ${enrollment.certificate.number}` : "Certificate is issued when every lesson is completed."}
              </p>
            ) : (
              <p className="mt-3 text-sm text-ink/60">A certificate is not enabled for this course.</p>
            )}
            {open ? (
              <Link to={`/academy/course/${enrollment.course_id}/learn`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep">
                Continue
              </Link>
            ) : (
              <p className="mt-4 text-sm text-ink/70">Course access opens after payment succeeds.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
