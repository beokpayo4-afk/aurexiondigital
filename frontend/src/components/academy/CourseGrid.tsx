import { CourseCard } from "@/components/cards/CourseCard";
import type { Course } from "@/types/catalog";

type CourseGridProps = {
  courses: Course[];
};

export function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          title={course.title}
          summary={course.summary}
          level={course.level}
          duration={course.duration_label}
          priceAmount={course.price_amount}
          currency={course.currency}
          thumbnailUrl={course.thumbnail_url}
          href={`/academy/course/${course.slug}`}
        />
      ))}
    </div>
  );
}
