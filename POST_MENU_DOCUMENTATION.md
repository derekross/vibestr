# Post Menu Documentation

This document describes the 3-dot menu functionality for posts and replies in the Vibestr community platform, implementing the Chorus NIP-72 Extensions for moderated communities.

## Overview

The `PostMenu` component provides a dropdown menu with various actions that users can perform on posts and replies. The available actions depend on the user's role and the type of content (post vs reply).

## Features

### Universal Actions (Available to Everyone)

1. **Share Post/Reply**
   - Copies a direct link to the post or reply to the clipboard
   - Uses the browser's Clipboard API with fallback for older browsers
   - Shows success/error toast notifications

2. **Copy Event ID**
   - Copies the Nostr event ID to the clipboard
   - Useful for developers and advanced users

3. **View Raw Event**
   - Opens the raw JSON event data in a new browser tab
   - Helpful for debugging and understanding the underlying Nostr event structure

### Moderator Actions (Available to Community Moderators Only)

4. **Pin/Unpin Post** (Posts Only)
   - Allows moderators to pin important posts to the top of the community
   - Uses NIP-72 Extension Kind 34554 (Pinned Posts List)
   - Not available for replies (only top-level posts can be pinned)

5. **Remove Post/Reply**
   - Allows moderators to remove inappropriate content
   - Creates a Kind 4551 (Post Removal) event according to NIP-72 Extensions
   - Works for both posts and replies

6. **Ban User**
   - Allows moderators to ban users from the community
   - Updates the Kind 34553 (Banned Members List) event
   - Not available when viewing your own posts (can't ban yourself)

## Technical Implementation

### NIP-72 Compliance

The menu actions follow the Chorus NIP-72 Extensions specification:

- **Kind 4551**: Post Removal events for content moderation
- **Kind 34553**: Banned Members List for user management  
- **Kind 34554**: Pinned Posts List for content organization

### Component Structure

```tsx
<PostMenu 
  event={nostrEvent}      // The Nostr event (post or reply)
  isReply={boolean}       // Whether this is a reply (affects available actions)
  className={string}      // Optional styling for the trigger button
/>
```

### Permission System

The menu automatically detects user permissions:

1. **Regular Users**: See universal actions only
2. **Moderators**: See all actions including moderation tools
3. **Community Creator**: Has full moderator permissions

Moderator status is determined by checking:
- If user is the community creator (pubkey matches community definition)
- If user is listed as a moderator in the community definition event

### Error Handling

- Graceful fallbacks for clipboard operations
- Toast notifications for all user actions
- Proper error handling for failed moderation actions

### Accessibility

- Proper ARIA labels and screen reader support
- Keyboard navigation support
- Clear visual indicators for destructive actions

## Usage Examples

### Basic Post Menu
```tsx
import { PostMenu } from '@/components/community/PostMenu';

<PostMenu event={postEvent} isReply={false} />
```

### Reply Menu with Custom Styling
```tsx
<PostMenu 
  event={replyEvent} 
  isReply={true} 
  className="h-6 w-6 p-0" 
/>
```

## Integration

The `PostMenu` component is integrated into:

1. **CommunityPost**: Main post component with full menu
2. **CommunityReply**: Reply component with reply-specific menu

Both components automatically handle the appropriate `isReply` flag and styling.

## Security Considerations

- All moderation actions require proper authentication
- Permission checks are performed both client-side and server-side
- Banned user lists are respected across all community interactions
- Event signatures ensure action authenticity

## Future Enhancements

Potential future additions to the menu:

1. **Report Content**: Allow users to report inappropriate content
2. **Mute User**: Personal muting without community-wide banning
3. **Edit Post**: Allow post authors to edit their content
4. **Bookmark**: Personal bookmarking system
5. **Translate**: Automatic translation for international communities

## Testing

The component includes comprehensive tests covering:

- Menu rendering and interaction
- Permission-based action visibility
- Different behavior for posts vs replies
- Error handling scenarios

Run tests with: `npm test`