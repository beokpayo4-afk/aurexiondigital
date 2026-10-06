type CurriculumLesson = {
  id: string;
  title: string;
  is_preview?: boolean;
  body?: string | null;
};

type CurriculumModule = {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
};

type CourseCurriculumProps = {
  modules: CurriculumModule[];
  locked?: boolean;
  activeLessonId?: string;
  onSelect?: (lessonId: string) => void;
};

export function CourseCurriculum({ modules, locked = true, activeLessonId, onSelect }: CourseCurriculumProps) {
  if (modules.length === 0) {
    return <p className="text-sm text-ink/70">No modules are published.</p>;
  }

  return (
    <div className="space-y-6">
      {modules.map((module) => (
        <section key={module.id}>
          <h3 className="font-display text-2xl">{module.title}</h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {module.lessons.map((lesson) => {
              const open = !locked || lesson.is_preview;
              return (
                <li key={lesson.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {onSelect && open ? (
                      <button
                        type="button"
                        className={`min-h-11 text-left text-sm font-semibold ${lesson.id === activeLessonId ? "text-champagne-deep" : "text-ink"}`}
                        onClick={() => onSelect(lesson.id)}
                      >
                        {lesson.title}
                      </button>
                    ) : (
                      <span className="text-sm">{lesson.title}</span>
                    )}
                    <span className="text-xs uppercase tracking-[0.14em] text-ink/50">
                      {lesson.is_preview ? "Preview" : locked ? "Enrolled students" : "Lesson"}
                    </span>
                  </div>
                  {lesson.body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/75">{lesson.body}</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
