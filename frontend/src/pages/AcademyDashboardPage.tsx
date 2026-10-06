import { StudentDashboard } from "@/components/academy/StudentDashboard";
import { usePageTitle } from "@/hooks/usePageTitle";

export function AcademyDashboardPage() {
  usePageTitle("Student dashboard");

  return (
    <div>
      <h1 className="font-display text-5xl">Dashboard</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/75">Your enrollments and progress. A course stays locked until payment succeeds.</p>
      <div className="mt-8">
        <StudentDashboard />
      </div>
    </div>
  );
}
