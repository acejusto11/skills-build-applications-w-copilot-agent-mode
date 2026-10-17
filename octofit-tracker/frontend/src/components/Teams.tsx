import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      fetchPath="/api/teams"
      emptyText="No teams"
      renderItem={(team) => (
        <div>
          <strong>{String(team.name ?? 'Team')}</strong>
          <span> · {Array.isArray(team.members) ? team.members.length : 0} members</span>
        </div>
      )}
    />
  );
}
