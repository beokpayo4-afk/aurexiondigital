import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { CourseCurriculum } from "@/components/academy/CourseCurriculum";
import { ContentImage } from "@/components/ui/ContentImage";
import { useAuth } from "@/hooks/useAuth";
import { buyCourse, type CourseOutline } from "@/services/academyService";
import { formatMoney } from "@/utils/format";
import { apiErrorMessage } from "@/utils/apiError";

type CourseDetailsProps = {
  course: CourseOutline;
};

export function CourseDetails({ course }: CourseDetailsProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const price = formatMoney(course.price_amount, course.currency);
  const enrolled = course.enrollment_status === "active" || course.enrollment_status === "completed";

  const onBuy = async () => {
    if (!isAuthenticated) {
      navigate("/academy/login", { state: { from: `/academy/course/${course.slug}` } });
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await buyCourse(course.id);
      navigate(`/order-success?order=${result.order_id}`);
    } catch (reason) {
      setError(apiErrorMessage(reason, "The course order could not be created."));
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        {course.thumbnail_url ? (
          <ContentImage src={course.thumbnail_url} alt="" className="aspect-video w-full rounded-md object-cover" />
        ) : null}
        {course.description ? <p className="mt-6 text-sm leading-7 text-ink/80">{course.description}</p> : null}
        {course.learning_outcomes.length > 0 ? (
          <>
            <h2 className="mt-10 text-2xl font-semibold">What you will cover</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink/80">
              {course.learning_outcomes.map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          </>
        ) : null}
        <h2 className="mt-10 text-2xl font-semibold">Lessons</h2>
        <div className="mt-4">
          <CourseCurriculum modules={course.modules} locked />
        </div>
        {course.resources.length > 0 ? (
          <>
            <h2 className="mt-10 text-2xl font-semibold">Files</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {course.resources.map((resource) => (
                <li key={resource.id}>{resource.title}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
      <aside className="h-fit rounded-xl border border-line bg-white p-6 shadow-card">
        <p className="text-2xl font-semibold">{price ?? "Price on request"}</p>
        {course.level ? <p className="mt-3 text-sm text-ink/70">{course.level}</p> : null}
        {course.duration_label ? <p className="mt-1 text-sm text-ink/70">{course.duration_label}</p> : null}
        {course.certificate_enabled ? (
          <p className="mt-4 text-sm leading-6 text-ink/70">A certificate is issued when every lesson is completed.</p>
        ) : null}
        {enrolled ? (
          <button
            type="button"
            className="mt-6 min-h-11 rounded-md bg-champagne px-5 text-sm font-semibold text-night"
            onClick={() => navigate(`/academy/course/${course.id}/learn`)}
          >
            Continue learning
          </button>
        ) : (
          <button type="button" className="mt-6 min-h-11 rounded-md bg-champagne px-5 text-sm font-semibold text-night" disabled={!price || submitting} onClick={() => void onBuy()}>
            {submitting ? "Placing order" : "Buy Now"}
          </button>
        )}
        {course.enrollment_status === "pending" ? (
          <p className="mt-4 text-sm text-ink/70">Payment is pending. Course access opens after payment succeeds.</p>
        ) : null}
        <p className="mt-4 text-sm leading-6 text-ink/60">Lesson material and downloads stay on the server until an enrollment is active.</p>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
