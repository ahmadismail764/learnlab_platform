export const LOGIN_DEMO_ACCOUNTS = [
  {
    role: 'learner',
    labelKey: 'auth:learner',
    username: 'learner',
    email: 'learner@example.test',
    password: 'learner123',
  },
  {
    role: 'admin',
    labelKey: 'auth:admin',
    username: 'admin',
    email: 'admin@example.test',
    password: 'admin123',
  },
] as const

export const LEADERBOARD_DEMO_ACCOUNTS = [
  {
    username: 'leader_alpha',
    email: 'leader.alpha@example.test',
    password: 'learner123',
    currentXp: 860,
    streakCount: 9,
  },
  {
    username: 'leader_beta',
    email: 'leader.beta@example.test',
    password: 'learner123',
    currentXp: 540,
    streakCount: 6,
  },
  {
    username: 'leader_gamma',
    email: 'leader.gamma@example.test',
    password: 'learner123',
    currentXp: 320,
    streakCount: 4,
  },
] as const

export const DEMO_SEED_TOPIC = {
  name: 'Seeded Discrete Mathematics',
  subtopicName: 'Seeded Logic Basics',
  questionCount: 3,
} as const
