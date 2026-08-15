"use client";

import { useMemo, useRef, useState } from "react";

export type IngredientOption = { id: string; name: string; category: string };

export default function PantryPicker({
  allIngredients,
  selected,
  onChange,
}: {
  allIngredients: IngredientOption[];
  selected: IngredientOption[];
  onChange: (next: IngredientOption[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allIngredients
      .filter((i) => !selectedIds.has(i.id) && i.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, allIngredients, selectedIds]);

  function addIngredient(ing: IngredientOption) {
    onChange([...selected, ing]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeIngredient(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions[0]) {
              e.preventDefault();
              addIngredient(suggestions[0]);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Type an ingredient — garlic, paneer, buttermilk…"
          className="w-full rounded-xl px-4 py-3 font-body text-base outline-none border"
          style={{
            background: "var(--pp-parchment)",
            color: "var(--pp-ink)",
            borderColor: "var(--pp-line)",
          }}
          aria-label="Search for an ingredient to add to your pantry"
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
                  onClick={() => addIngredient(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-black/5 flex items-center justify-between"
                  style={{ color: "var(--pp-ink)" }}
                >
                  <span>{s.name}</span>
                  <span className="font-utility text-[11px] uppercase" style={{ color: "var(--pp-ink-soft)" }}>
                    {s.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 min-h-[2.5rem]">
        {selected.length === 0 && (
          <p className="text-sm" style={{ color: "var(--pp-parchment-dim)" }}>
            Nothing added yet — search above, or try{" "}
            {["Garlic", "Onion", "Tomato", "Paneer", "Butter"].map((s, i, arr) => (
              <span key={s}>
                <button
                  type="button"
                  className="underline underline-offset-2"
                  style={{ color: "var(--pp-mustard)" }}
                  onClick={() => {
                    const match = allIngredients.find((a) => a.name === s);
                    if (match && !selectedIds.has(match.id)) addIngredient(match);
                  }}
                >
                  {s.toLowerCase()}
                </button>
                {i < arr.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        )}
        {selected.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5 text-sm"
            style={{ background: "var(--pp-sage-soft)", color: "var(--pp-ink)" }}
          >
            {s.name}
            <button
              type="button"
              onClick={() => removeIngredient(s.id)}
              aria-label={`Remove ${s.name}`}
              className="grid place-items-center w-5 h-5 rounded-full hover:bg-black/10"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
