"use client";

import { useMemo, useState } from "react";
import type { IngredientOption } from "./PantryPicker";

export default function IngredientSelect({
  label,
  allIngredients,
  value,
  onChange,
}: {
  label: string;
  allIngredients: IngredientOption[];
  value: IngredientOption | null;
  onChange: (v: IngredientOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.toLowerCase();
    return allIngredients.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, allIngredients]);

  return (
    <div className="relative flex-1">
      <label className="block font-utility text-[11px] uppercase tracking-wide mb-1.5" style={{ color: "var(--pp-parchment-dim)" }}>
        {label}
      </label>
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setOpen(true);
          }}
          className="w-full text-left rounded-xl px-4 py-3 border flex items-center justify-between"
          style={{ background: "var(--pp-parchment)", color: "var(--pp-ink)", borderColor: "var(--pp-line)" }}
        >
          <span className="font-display text-lg">{value.name}</span>
          <span className="text-xs" style={{ color: "var(--pp-ink-soft)" }}>change</span>
        </button>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search an ingredient…"
            className="w-full rounded-xl px-4 py-3 border outline-none"
            style={{ background: "var(--pp-parchment)", color: "var(--pp-ink)", borderColor: "var(--pp-line)" }}
          />
          {open && suggestions.length > 0 && (
            <ul
              className="absolute z-10 mt-2 w-full rounded-xl border overflow-hidden"
              style={{ background: "var(--pp-parchment)", borderColor: "var(--pp-line)" }}
            >
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-black/5"
                    style={{ color: "var(--pp-ink)" }}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
