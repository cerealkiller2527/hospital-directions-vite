import React from "react";

// Highlight Text Component
export function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(`(${query.trim()})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-yellow-100 dark:bg-yellow-900">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
} 