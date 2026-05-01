import { useEffect, useMemo, useRef, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface Props {
  html: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildDocument(html: string): { anchoredHtml: string; tocItems: TocItem[] } {
  const container = document.createElement("div");
  container.innerHTML = html;

  const seen = new Map<string, number>();
  const headings = Array.from(
    container.querySelectorAll<HTMLHeadingElement>("h2, h3")
  );

  const tocItems = headings.flatMap((heading) => {
    const text = heading.textContent?.trim() ?? "";
    if (!text) return [];

    const baseSlug = slugify(text) || "section";
    const seenCount = seen.get(baseSlug) ?? 0;
    seen.set(baseSlug, seenCount + 1);

    const id = seenCount === 0 ? baseSlug : `${baseSlug}-${seenCount + 1}`;
    heading.id = id;

    return [
      {
        id,
        text,
        level: Number(heading.tagName.slice(1)),
      },
    ];
  });

  return { anchoredHtml: container.innerHTML, tocItems };
}

export function MarkdownDocumentView({ html }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { anchoredHtml, tocItems } = useMemo(() => buildDocument(html), [html]);

  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content || tocItems.length === 0) {
      setActiveId(null);
      return;
    }

    let frame = 0;

    const updateActiveHeading = () => {
      frame = 0;

      const headings = tocItems
        .map((item) => content.querySelector<HTMLElement>(`#${CSS.escape(item.id)}`))
        .filter((heading): heading is HTMLElement => heading !== null);

      if (headings.length === 0) return;

      const scrollTop = scroller.scrollTop;
      const nearBottom =
        scroller.scrollHeight - scroller.clientHeight - scrollTop < 24;

      if (nearBottom) {
        setActiveId(headings[headings.length - 1].id);
        return;
      }

      const scrollerTop = scroller.getBoundingClientRect().top;
      const activeHeading = headings.reduce<HTMLElement>((current, heading) => {
        const top = heading.getBoundingClientRect().top - scrollerTop;
        return top <= 88 ? heading : current;
      }, headings[0]);

      setActiveId(activeHeading.id);
    };

    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateActiveHeading);
    };

    updateActiveHeading();
    scroller.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tocItems]);

  const handleTocClick = (id: string) => {
    const scroller = scrollRef.current;
    const heading = contentRef.current?.querySelector<HTMLElement>(
      `#${CSS.escape(id)}`
    );

    if (!scroller || !heading) return;

    const scrollerTop = scroller.getBoundingClientRect().top;
    const headingTop = heading.getBoundingClientRect().top;
    const scrollTop = scroller.scrollTop + headingTop - scrollerTop - 24;

    scroller.scrollTo({ top: scrollTop, behavior: "smooth" });
    setActiveId(id);
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-thin">
      <div
        className={
          tocItems.length > 0
            ? "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_16rem] gap-8 p-6 max-w-7xl mx-auto"
            : "p-6 max-w-4xl mx-auto"
        }
      >
        <div className="max-w-4xl mx-auto w-full min-w-0">
          <div
            ref={contentRef}
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: anchoredHtml }}
          />
        </div>

        {tocItems.length > 0 && (
          <aside className="hidden xl:block sticky top-6 self-start max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin pl-1">
            <div className="mb-4 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
              Contents
            </div>
            <nav
              aria-label="Document table of contents"
              className="relative space-y-1 before:absolute before:bottom-1 before:left-0 before:top-1 before:w-px before:bg-border-subtle"
            >
              {tocItems.map((item) => {
                const active = item.id === activeId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTocClick(item.id)}
                    className={`relative block w-full rounded-r-md py-1.5 pr-3 text-left text-xs leading-snug transition-colors before:absolute before:bottom-1 before:left-0 before:top-1 before:w-px before:rounded-full ${
                      item.level === 3
                        ? "pl-8"
                        : item.level === 2
                          ? "pl-5"
                          : "pl-3"
                    } ${
                      active
                        ? "bg-surface-2/60 text-zinc-100 before:bg-blue-400"
                        : "text-zinc-500 before:bg-transparent hover:bg-surface-2/40 hover:text-zinc-300"
                    }`}
                  >
                    {item.text}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
