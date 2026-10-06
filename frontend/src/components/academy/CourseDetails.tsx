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
          <ContentImage src={course.thumbnail_url} alt="" className="aspect-video w-full rounded-xl object-cover" />
        ) : (
          <p className="rounded-xl border border-dashed border-line px-6 py-10 text-sm text-ink/60">No thumbnail is published.</p>
        )}
        <p className="mt-6 text-sm leading-7 text-ink/80">{course.description ?? "No description is published."}</p>
        <h2 className="mt-10 font-display text-3xl">Learning outcomes</h2>
        {course.learning_outcomes.length > 0 ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink/80">
            {course.learning_outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink/70">No learning outcomes are published.</p>
        )}
        <h2 className="mt-10 font-display text-3xl">Curriculum</h2>
        <div className="mt-4">
          <CourseCurriculum modules={course.modules} locked />
        </div>
        <h2 className="mt-10 font-display text-3xl">Resources</h2>
        {course.resources.length === 0 ? <p className="mt-4 text-sm text-ink/70">No downloadable resources are published.</p> : null}
        <ul className="mt-4 space-y-2 text-sm">
          {course.resources.map((resource) => (
            <li key={resource.id}>{resource.title}</li>
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-xl border border-line bg-white p-6 shadow-card">
        <p className="font-display text-4xl">{price ?? "Price is not published"}</p>
        <p className="mt-3 text-sm text-ink/70">{course.level ?? "Level is not published."}</p>
        <p className="mt-1 text-sm text-ink/70">{course.duration_label ?? "Duration is not published."}</p>
        <p className="mt-4 text-sm leading-6 text-ink/70">
          {course.certificate_enabled
            ? "A certificate is issued when every lesson is completed."
            : "A certificate is not enabled for this course."}
        </p>
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
