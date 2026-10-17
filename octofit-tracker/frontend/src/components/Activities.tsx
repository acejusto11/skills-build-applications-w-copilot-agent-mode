import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      fetchPath="/api/activities"
      emptyText="No activities"
      renderItem={(activity) => (
        <div>
          <strong>{String(activity.type ?? 'Activity')}</strong>
          <span> · {String(activity.minutes ?? 0)} minutes · {String(activity.points ?? 0)} points</span>
        </div>
      )}
    />
  );
}
