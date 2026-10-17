import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      fetchPath="/api/leaderboard"
      emptyText="No leaderboard"
      renderItem={(entry) => (
        <div>
          <strong>{String(entry.teamName ?? 'Team')}</strong>
          <span> · {String(entry.totalPoints ?? 0)} pts · Rank {String(entry.rank ?? 1)}</span>
        </div>
      )}
    />
  );
}
