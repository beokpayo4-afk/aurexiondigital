import type { LessonStudy } from "@/services/academyService";
import { safeUrl } from "@/utils/safeUrl";

type LessonPlayerProps = {
  lesson: LessonStudy | null;
  onComplete: () => void;
  completing?: boolean;
};

export function LessonPlayer({ lesson, onComplete, completing = false }: LessonPlayerProps) {
  if (!lesson) {
    return <p className="text-sm text-ink/70">Select a lesson from the curriculum.</p>;
  }

  const videoUrl = safeUrl(lesson.external_url);

  return (
    <article className="rounded-xl border border-line bg-white p-6 shadow-card">
      <h2 className="font-display text-4xl">{lesson.title}</h2>
      {lesson.body ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink/80">{lesson.body}</p> : null}
      {!lesson.body && lesson.content_type !== "video_url" ? <p className="mt-4 text-sm text-ink/70">This lesson has no published content.</p> : null}
      {videoUrl && lesson.content_type === "video_url" ? (
        <a href={videoUrl} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-champagne-deep" target="_blank" rel="noopener noreferrer">
          Open lesson video
        </a>
      ) : null}
      <button type="button" className="mt-6 min-h-11 rounded-md bg-champagne px-5 text-sm font-semibold text-night" disabled={lesson.completed || completing} onClick={onComplete}>
        {lesson.completed ? "Completed" : completing ? "Saving" : "Mark complete"}
      </button>
    </article>
  );
}
