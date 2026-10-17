import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function normalizeObjectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw badRequest(`${field} must be a valid ObjectId.`);
  }
  return new mongoose.Types.ObjectId(value);
}

function normalizeMemberIds(members: unknown): mongoose.Types.ObjectId[] {
  if (!Array.isArray(members)) return [];
  return members.map((member) => normalizeObjectId(member, 'members[]'));
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const record = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const { userId, teamId, type, minutes } = record;

  if (!userId || !teamId || !type || minutes === undefined || minutes === null) {
    throw badRequest('Activity requires userId, teamId, type, and minutes.');
  }

  const safeMinutes = Number(minutes);
  if (!Number.isFinite(safeMinutes) || safeMinutes <= 0) {
    throw badRequest('minutes must be a positive number.');
  }

  const normalizedUserId = normalizeObjectId(userId, 'userId');
  const normalizedTeamId = normalizeObjectId(teamId, 'teamId');

  const [user, team] = await Promise.all([
    User.findById(normalizedUserId),
    Team.findById(normalizedTeamId),
  ]);

  if (!user) throw notFound('User not found.');
  if (!team) throw notFound('Team not found.');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: String(type),
    minutes: safeMinutes,
    points: Math.max(1, Math.round(safeMinutes)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const record = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const { name, mascot, members } = record;

  if (typeof name !== 'string' || !name.trim()) {
    throw badRequest('Team name is required.');
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw badRequest('Team mascot is required.');
  }

  const memberIds = normalizeMemberIds(members);

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'teamDetails' } },
    { $unwind: '$teamDetails' },
    { $project: { _id: 0, teamName: '$teamDetails.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  if (typeof userEmail !== 'string' || !userEmail.trim()) {
    throw badRequest('A user email is required.');
  }

  const user = await User.findOne({ email: { $regex: new RegExp(`^${userEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).lean();
  if (!user) {
    throw notFound('User not found.');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const activityTypes = new Map<string, number>();
  for (const activity of recentActivities) {
    const type = typeof activity.type === 'string' ? activity.type : 'general';
    activityTypes.set(type, (activityTypes.get(type) ?? 0) + 1);
  }

  const winningType = [...activityTypes.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? user.fitnessGoal;
  const preferredFocus = String(user.fitnessGoal || winningType || 'endurance');

  const workouts = await Workout.find().sort({ minutes: 1 }).lean();
  const ranked = [...workouts].sort((left, right) => {
    const leftBoost = left.focus === preferredFocus ? 2 : left.focus === winningType ? 1 : 0;
    const rightBoost = right.focus === preferredFocus ? 2 : right.focus === winningType ? 1 : 0;
    return rightBoost - leftBoost || Number(left.minutes) - Number(right.minutes);
  });

  return ranked.map((workout) => ({
    ...workout,
    reason: `Matches your ${preferredFocus} goal and recent ${winningType} activity.`,
  }));
}

export { User };
