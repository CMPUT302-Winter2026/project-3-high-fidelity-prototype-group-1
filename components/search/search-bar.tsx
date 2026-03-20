"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

type SearchBarProps = {
  initialQuery?: string;
  action?: string;
  placeholder?: string;
};

export function SearchBar({
  initialQuery = "",
  action = "/search",
  placeholder = "Search Cree or English, or ask a question"
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        router.push(trimmed ? `${action}?q=${encodeURIComponent(trimmed)}` : action);
      }}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="app-input pl-11 pr-4"
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </form>
  );
}
