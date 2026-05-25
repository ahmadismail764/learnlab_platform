export interface BackendAuthUser {
  id: number | string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "learner" | "admin" | string;
  is_staff: boolean;

  /**
   * Frontend-normalized field used across the app.
   * The backend may send `joined_at` instead.
   */
  date_joined: string;

  /** Raw backend field name (Django). */
  joined_at?: string;
  avatar_color?: string;
}

export function coerceBackendUser(partial: Partial<BackendAuthUser>): BackendAuthUser {
  const now = new Date().toISOString();
  const username = partial.username || partial.email?.split("@")[0] || "learner";

  const dateJoined = partial.date_joined ?? partial.joined_at ?? now;

  return {
    id: partial.id ?? username,
    email: partial.email ?? "",
    username,
    first_name: partial.first_name ?? "",
    last_name: partial.last_name ?? "",
    role: partial.role ?? (partial.is_staff ? "admin" : "learner"),
    is_staff: partial.is_staff ?? partial.role === "admin",
    date_joined: dateJoined,
    joined_at: partial.joined_at,
    avatar_color: partial.avatar_color,
  };
}
