"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function CustomerSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/admin/customers?q=${encodeURIComponent(trimmed)}` : "/admin/customers");
  }

  return (
    <form onSubmit={submit} className="relative w-full sm:w-72">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث بالاسم أو البريد أو الهاتف"
        className="input-field py-2.5 ps-10 text-sm"
      />
      <Search className="w-4 h-4 text-gray-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
    </form>
  );
}
