import { useMemo } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Parses content of text note events so that URLs, hashtags, and markdown are properly rendered. */
export function NoteContent({
  event,
  className,
}: NoteContentProps) {
  // Process the content to render markdown, mentions, links, etc.
  const content = useMemo(() => {
    const text = event.content;

    // Split into lines for better markdown processing
    const lines = text.split('\n');
    const parts: React.ReactNode[] = [];
    let keyCounter = 0;

    lines.forEach((line, lineIndex) => {
      // Check for headers first (line-based)
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const headerText = headerMatch[2];
        const HeaderComponent = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
        const headerClass = level === 1 ? 'text-2xl font-bold mb-2 mt-4' :
                          level === 2 ? 'text-xl font-semibold mb-2 mt-3' :
                          'text-lg font-medium mb-1 mt-2';

        parts.push(
          <HeaderComponent key={`header-${keyCounter++}`} className={headerClass}>
            {processInlineMarkdown(headerText, keyCounter)}
          </HeaderComponent>
        );
      } else if (line.trim() === '') {
        // Empty line - add spacing
        parts.push(<div key={`empty-${keyCounter++}`} className="h-2" />);
      } else {
        // Process inline markdown for regular lines
        const processedLine = processInlineMarkdown(line, keyCounter);
        if (processedLine) {
          parts.push(
            <div key={`line-${lineIndex}-${keyCounter++}`} className="block">
              {processedLine}
            </div>
          );
        }
      }
    });

    return parts;
  }, [event.content]);

  return (
    <div className={cn("break-words", className)}>
      {content}
    </div>
  );
}

// Function to process inline markdown within a line
function processInlineMarkdown(text: string, baseKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(https?:\/\/[^\s]+)|nostr:(npub1|note1|nprofile1|nevent1)([023456789acdefghjklmnpqrstuvwxyz]+)|(#\w+)|(\*\*|__)((?!\5)[^\r\n*_]*?)\5|(\*|_)((?!\7)[^\r\n*_]*?)\7|`([^`\r\n]+)`|!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = baseKey * 1000; // Ensure unique keys

  while ((match = regex.exec(text)) !== null) {
    const [
      fullMatch,
      url,
      nostrPrefix,
      nostrData,
      hashtag,
      boldDelim,
      boldText,
      italicDelim,
      italicText,
      codeText,
      imageAlt,
      imageUrl,
      linkText,
      linkUrl
    ] = match;

    const index = match.index;

    // Add text before this match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    if (url) {
      // Handle URLs
      parts.push(
        <a
          key={`url-${keyCounter++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {url}
        </a>
      );
    } else if (nostrPrefix && nostrData) {
      // Handle Nostr references
      try {
        const nostrId = `${nostrPrefix}${nostrData}`;
        const decoded = nip19.decode(nostrId);

        if (decoded.type === 'npub') {
          const pubkey = decoded.data;
          parts.push(
            <NostrMention key={`mention-${keyCounter++}`} pubkey={pubkey} />
          );
        } else {
          parts.push(
            <Link
              key={`nostr-${keyCounter++}`}
              to={`/${nostrId}`}
              className="text-blue-500 hover:underline"
            >
              {fullMatch}
            </Link>
          );
        }
      } catch {
        parts.push(fullMatch);
      }
    } else if (hashtag) {
      // Handle hashtags
      const tag = hashtag.slice(1);
      parts.push(
        <Link
          key={`hashtag-${keyCounter++}`}
          to={`/t/${tag}`}
          className="text-blue-500 hover:underline"
        >
          {hashtag}
        </Link>
      );
    } else if (boldText) {
      // Handle bold text
      parts.push(
        <strong key={`bold-${keyCounter++}`} className="font-semibold">
          {boldText}
        </strong>
      );
    } else if (italicText) {
      // Handle italic text
      parts.push(
        <em key={`italic-${keyCounter++}`} className="italic">
          {italicText}
        </em>
      );
    } else if (codeText) {
      // Handle inline code
      parts.push(
        <code key={`code-${keyCounter++}`} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
          {codeText}
        </code>
      );
    } else if (imageUrl) {
      // Handle images
      parts.push(
        <img
          key={`image-${keyCounter++}`}
          src={imageUrl}
          alt={imageAlt || 'Image'}
          className="max-w-full h-auto rounded-lg my-2 border block"
        />
      );
    } else if (linkUrl) {
      // Handle links
      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {linkText}
        </a>
      );
    }

    lastIndex = index + fullMatch.length;
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no special content was found, just use the plain text
  if (parts.length === 0) {
    parts.push(text);
  }

  return parts;
}

// Helper component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName
          ? "text-blue-500"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      @{displayName}
    </Link>
  );
}