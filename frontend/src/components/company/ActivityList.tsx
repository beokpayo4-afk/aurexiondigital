type ActivityListProps = {
  activities: readonly string[];
};

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <ul className="grid gap-x-10 sm:grid-cols-2">
      {activities.map((activity) => (
        <li key={activity} className="border-t border-line py-3 text-sm leading-6 text-ink/80">
          {activity}
        </li>
      ))}
    </ul>
  );
}
