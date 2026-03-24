import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useAbandonedCartTracker } from "@/hooks/useAbandonedCartTracker";

export const ActivityLogger = () => {
  useActivityLogger();
  useAbandonedCartTracker();
  return null;
};
