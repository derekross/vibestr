# Vibe Coders Community NIP

`draft` `optional`

This document describes the Vibe Coders community implementation using NIP-72 (Moderated Communities) and the Chorus NIP-72 Extensions.

## Community Overview

**Vibe Coders** is a NIP-72 moderated community focused on vibe coding, tools, tips, tricks, and sharing of experiences and apps. The community uses the hard-coded community ID:

```
34550:3f770d65d3a764a9c5cb503ae123e62ec7598ad035d836e2a810f3877a745b24:vibe-coding-mcigj8zi
```

## Implementation Details

### Core NIP-72 Compliance

This implementation follows the standard NIP-72 specification for moderated communities:

- **Kind 34550**: Community definition events
- **Kind 4550**: Post approval events
- **Community tagging**: All posts use `a` tags to reference the community
- **Topic filtering**: All content is tagged with `t: "vibe-coding"` for efficient relay-level filtering

### Chorus Extensions Integration

The implementation incorporates the full Chorus NIP-72 Extensions specification:

#### Member Management (Kinds 34551-34553)
- **Kind 34551**: Approved members list for auto-approval workflow
- **Kind 34552**: Declined members list for join request management
- **Kind 34553**: Banned members list for moderation

#### Content Organization (Kinds 34554-34555)
- **Kind 34554**: Pinned posts list for highlighting important content
- **Kind 34555**: Pinned groups list for user's favorite communities

#### Moderation Actions (Kinds 4551-4554)
- **Kind 4551**: Post removal events
- **Kind 4552**: Join request events
- **Kind 4553**: Leave request events
- **Kind 4554**: Close report events

#### Enhanced Post Types (Kinds 11, 1111)
- **Kind 11**: Group posts specifically for community content
- **Kind 1111**: Group post replies for threaded discussions

### Content Filtering Strategy

The implementation uses a community-first filtering approach:

1. **Primary filtering**: `#a: ["34550:3f770d65d3a764a9c5cb503ae123e62ec7598ad035d836e2a810f3877a745b24:vibe-coding-mcigj8zi"]`
2. **Optional topic filtering**: `#t: ["vibe-coding"]` (recommended but not required)

This allows for:
- Maximum compatibility with different Nostr clients
- Community-specific content discovery regardless of topic tags
- Optional topic-based cross-community content sharing
- Efficient relay-level filtering using the community `a` tag

### Event Validation

All community events undergo validation to ensure:
- Proper community tagging with the correct `a` tag
- Compliance with NIP-72 and Chorus extension schemas
- Optional topic tag (`t: "vibe-coding"`) for enhanced categorization

### Auto-Approval Workflow

The implementation supports the Chorus auto-approval workflow:
- Users in the approved members list (Kind 34551) can post without individual approval
- Regular users require moderator approval via Kind 4550 events
- Banned users (Kind 34553) are filtered out from all community interactions

## Security Considerations

- Member lists can only be updated by community moderators
- Post approvals are verified against the community's moderator list
- Banned user filtering is enforced at the client level
- All moderation actions include proper community and user references

## Client Features

The Vibe Coders community client implements:

- **Community feed**: Displays approved posts with threaded replies
- **Post creation**: Form for publishing to the community with proper tagging
- **Reply system**: Nested threaded discussions using Kind 1111 events with reply-to-reply functionality
- **Comprehensive Management UI**: Full moderation interface including member management, content approval, pinned posts management, and community settings
- **Join/leave workflow**: User-friendly community membership management
- **Pinned content**: Visual indicators for pinned posts
- **Real-time updates**: Live feed updates using TanStack Query

## Interoperability

This implementation is designed to be fully compatible with:
- Standard NIP-72 clients (basic community functionality)
- Chorus-compatible clients (full feature set)
- Generic Nostr clients (posts appear as regular notes with community tags)

The use of standard event kinds and tag structures ensures maximum interoperability across the Nostr ecosystem while providing enhanced community features for compatible clients.