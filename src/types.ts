export type ListType = "inbox" | "now" | "next" | "waiting" | "done";

export interface User {
  id: string;
  idp_sub: string | null;
  push_subscription: string | null;
  created_at: number | null;
}

export interface Task {
  id: string;
  user_id: string;
  content: string;
  list: ListType;
  created_at: number | null;
  updated_at: number | null;
}

export interface TaskLog {
  id: string;
  task_id: string;
  from_list: ListType | null;
  to_list: ListType;
  created_at: number | null;
}
