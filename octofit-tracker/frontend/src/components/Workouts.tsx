import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      fetchPath="/api/workouts/suggestions/mona@example.com"
      emptyText="No workouts"
      renderItem={(workout) => (
        <div>
          <strong>{String(workout.title ?? 'Workout')}</strong>
          <span> · {String(workout.focus ?? 'focus')} · {String(workout.reason ?? 'Suggested for you')}</span>
        </div>
      )}
    />
  );
}
