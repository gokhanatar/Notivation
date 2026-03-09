import { useState, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  onNoteLinkClick?: (noteTitle: string) => void;
}

// Lazy-loaded markdown renderer
let ReactMarkdownComponent: any = null;
let remarkGfmPlugin: any = null;
let markdownLoaded = false;

async function loadMarkdownDeps() {
  if (markdownLoaded) return;
  try {
    const [md, gfm] = await Promise.all([
      import('react-markdown'),
      import('remark-gfm'),
    ]);
    ReactMarkdownComponent = md.default;
    remarkGfmPlugin = gfm.default;
    markdownLoaded = true;
  } catch (e) {
    console.warn('Markdown dependencies not available:', e);
  }
}

export function MarkdownPreview({ content, className, onNoteLinkClick }: MarkdownPreviewProps) {
  const [ready, setReady] = useState(markdownLoaded);

  useEffect(() => {
    if (!markdownLoaded) {
      loadMarkdownDeps().then(() => setReady(true));
    }
  }, []);

  // Process wikilinks: [[Note Title]] → clickable links
  const processedContent = content.replace(
    /\[\[([^\]]+)\]\]/g,
    (_, title) => `[📎 ${title}](wikilink:${encodeURIComponent(title)})`
  );

  if (!ready || !ReactMarkdownComponent) {
    // Fallback: render as plain text with basic formatting
    return (
      <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    );
  }

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdownComponent
        remarkPlugins={remarkGfmPlugin ? [remarkGfmPlugin] : []}
        components={{
          a: ({ href, children, ...props }: any) => {
            // Handle wikilinks
            if (href?.startsWith('wikilink:')) {
              const title = decodeURIComponent(href.replace('wikilink:', ''));
              return (
                <button
                  onClick={() => onNoteLinkClick?.(title)}
                  className="text-primary hover:underline cursor-pointer font-medium inline"
                  type="button"
                >
                  {children}
                </button>
              );
            }
            // Regular links
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdownComponent>
    </div>
  );
}
