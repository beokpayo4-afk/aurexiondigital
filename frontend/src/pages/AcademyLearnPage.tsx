import { useState } from "react";
import { useParams } from "react-router-dom";

import { CourseCurriculum } from "@/components/academy/CourseCurriculum";
import { LessonPlayer } from "@/components/academy/LessonPlayer";
import { ProgressBar } from "@/components/academy/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { completeLesson, downloadResource, getStudyCourse, type LessonStudy } from "@/services/academyService";
import { apiErrorMessage } from "@/utils/apiError";

export function AcademyLearnPage() {
  const { courseId = "" } = useParams();
  const study = useAsyncData(() => getStudyCourse(courseId), [courseId]);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  usePageTitle(study.data?.title ?? "Course");

  const lessons = study.data?.modules.flatMap((module) => module.lessons) ?? [];
  const selected: LessonStudy | null = lessons.find((lesson) => lesson.id === (lessonId ?? lessons[0]?.id)) ?? null;

  const onComplete = async () => {
    if (!selected) {
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await completeLesson(selected.id);
      study.reload();
    } catch (reason) {
      setNotice(apiErrorMessage(reason, "Progress could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  if (study.loading) {
    return <LoadingState label="Loading course" />;
  }
  if (study.error) {
    return <ErrorState message={study.error} onRetry={study.reload} />;
  }
  if (!study.data) {
    return <EmptyState title="This course is not available" description="Enrolled students can open a course after payment succeeds." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl">{study.data.title}</h1>
        <div className="mt-4 max-w-md">
          <ProgressBar value={study.data.progress_percent} />
          <p className="mt-2 text-sm text-ink/65">{study.data.progress_percent}% complete</p>
        </div>
        <p className="mt-3 text-sm text-ink/70">
          {study.data.certificate.enabled
            ? study.data.certificate.number
              ? `Certificate ${study.data.certificate.number}`
              : "A certificate is issued when every lesson is completed."
            : "A certificate is not enabled for this course."}
        </p>
      </div>
      <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        <CourseCurriculum
          modules={study.data.modules}
          locked={false}
          activeLessonId={selected?.id}
          onSelect={setLessonId}
        />
        <div>
          <LessonPlayer lesson={selected} onComplete={() => void onComplete()} completing={saving} />
          {notice ? (
            <p role="alert" className="mt-4 text-sm text-red-800">
              {notice}
            </p>
          ) : null}
          <h2 className="mt-8 font-display text-3xl">Resources</h2>
          {study.data.resources.length === 0 ? <p className="mt-3 text-sm text-ink/70">No downloadable resources are published.</p> : null}
          <ul className="mt-3 space-y-3">
            {study.data.resources.map((resource) => (
              <li key={resource.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3">
                <span className="text-sm">{resource.title}</span>
                {resource.available ? (
                  <button
                    type="button"
                    className="min-h-11 text-sm font-semibold text-champagne-deep"
                    onClick={() => {
                      setNotice(null);
                      downloadResource(resource.id).catch((reason: unknown) => {
                        setNotice(apiErrorMessage(reason, "This download is not available."));
                      });
                    }}
                  >
                    Download
                  </button>
                ) : (
                  <span className="text-sm text-ink/60">File is not available</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
