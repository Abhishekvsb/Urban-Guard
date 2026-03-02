export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER" | "EMERGENCY";

export interface User {
  id: number;
  username: string;
  role: UserRole;
  full_name: string;
}

export interface InfrastructureItem {
  id: number;
  name: string;
  type: string;
  status: "Active" | "Maintenance" | "Offline" | "Emergency Override";
  location: string;
  last_updated: string;
  health_score: number;
}

export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
}

export interface Stats {
  total: { count: number };
  active: { count: number };
  maintenance: { count: number };
  logsCount: { count: number };
}
