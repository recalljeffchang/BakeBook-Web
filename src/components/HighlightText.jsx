// src/components/HighlightText.jsx
// Highlights matched substrings within text

export default function HighlightText({ text, query }) {
  if (!query || !query.trim() || !text) return <>{text}</>;

  const keywords = query.trim().split(/\s+/).filter(Boolean);

  // Build a regex that matches any of the keywords
  const escaped = keywords.map(kw =>
    kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = keywords.some(
          kw => part.toLowerCase() === kw.toLowerCase()
        );
        return isMatch ? (
          <mark key={i} className="search-highlight">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
