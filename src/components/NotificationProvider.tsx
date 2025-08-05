import { useNotificationToasts } from '@/hooks/useNotificationToasts';

/**
 * Provider component that handles notification toasts
 * This component doesn't render anything but sets up the notification system
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Set up notification toasts
  useNotificationToasts();

  return <>{children}</>;
}