import { NavLink } from "react-router-dom";

type StudentSidebarProps = {
  courses: { id: string; title: string; to: string }[];
};

function itemClass(active: boolean): string {
  return active ? "text-champagne-deep" : "text-night/75 hover:text-night";
}

export function StudentSidebar({ courses }: StudentSidebarProps) {
  return (
    <nav aria-label="Student" className="space-y-6">
      <div className="flex flex-col gap-2 text-sm">
        <NavLink to="/academy/dashboard" className={({ isActive }) => `min-h-11 ${itemClass(isActive)}`}>
          Dashboard
        </NavLink>
        <NavLink to="/academy/courses" className={({ isActive }) => `min-h-11 ${itemClass(isActive)}`}>
          Courses
        </NavLink>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-night/55">Enrollments</p>
        {courses.length === 0 ? <p className="mt-3 text-sm text-night/70">No enrollments yet.</p> : null}
        <div className="mt-3 flex flex-col gap-2">
          {courses.map((course) => (
            <NavLink key={course.id} to={course.to} className={({ isActive }) => `inline-flex min-h-11 items-center break-words text-sm ${itemClass(isActive)}`}>
              {course.title}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
