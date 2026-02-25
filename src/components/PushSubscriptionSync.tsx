"use client";

import { useEffect } from "react";
import { syncPushSubscription } from "@/lib/push-client";

export default function PushSubscriptionSync({ userId }: { userId: string }) {
  useEffect(() => {
    void syncPushSubscription(userId);
  }, [userId]);

  return null;
}
