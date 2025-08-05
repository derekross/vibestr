import { useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/useToast';
import { genUserName } from '@/lib/genUserName';
import type { Notification } from '@/hooks/useNotifications';

/**
 * Hook to show toast notifications for new reactions and replies
 */
export function useNotificationToasts() {
  const { notifications } = useNotifications();
  const { toast } = useToast();
  const previousNotificationsRef = useRef<Notification[]>([]);

  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      previousNotificationsRef.current = [];
      return;
    }

    const previousNotifications = previousNotificationsRef.current;

    // Find new notifications (not in previous list)
    const newNotifications = notifications.filter(notification =>
      !previousNotifications.some(prev => prev.id === notification.id)
    );

    // Show toast for each new notification
    newNotifications.forEach(notification => {
      // Don't show toasts for notifications older than 5 minutes
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (notification.timestamp < fiveMinutesAgo) {
        return;
      }

      showNotificationToast(notification, toast);
    });

    // Update the previous notifications reference
    previousNotificationsRef.current = notifications;
  }, [notifications, toast]);
}

function showNotificationToast(
  notification: Notification,
  toast: ReturnType<typeof useToast>['toast']
) {
  // We can't use hooks inside this function, so we'll need to get author info differently
  // For now, we'll use a simplified approach
  const authorName = genUserName(notification.author);

  const getNotificationMessage = () => {
    if (notification.type === 'reaction') {
      const content = notification.event.content;
      if (content === '+' || content === '') {
        return `${authorName} liked your vibe coding post`;
      } else if (content === '-') {
        return `${authorName} disliked your vibe coding post`;
      } else {
        return `${authorName} reacted ${content} to your vibe coding post`;
      }
    } else {
      return `${authorName} replied to your vibe coding post`;
    }
  };

  const getPreviewText = () => {
    if (notification.targetEvent) {
      const text = notification.targetEvent.content;
      return text.length > 60 ? `${text.slice(0, 60)}...` : text;
    }
    return '';
  };

  toast({
    title: getNotificationMessage(),
    description: getPreviewText(),
    duration: 5000,
  });
}