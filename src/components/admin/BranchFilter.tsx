"use client";

import { useRouter } from "next/navigation";

interface BranchFilterProps {
  branches: { id: string; name: string; nameAr: string }[];
  selected?: string;
}

export function BranchFilter({ branches, selected }: BranchFilterProps) {
  const router = useRouter();

  return (
    <select
      defaultValue={selected ?? ""}
      onChange={(e) =>
        router.push(e.target.value ? `/admin/cars?branch=${e.target.value}` : "/admin/cars")
      }
      className="px-4 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-600"
    >
      <option value="">جميع الفروع</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.nameAr}
        </option>
      ))}
    </select>
  );
}
