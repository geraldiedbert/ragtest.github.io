"use client";

interface Props {
  title: string;
  options: string[];
  labels?: Record<string, string>;
  selected: string[];
  onChange: (values: string[]) => void;
}

export function FilterGroup({ title, options, labels, selected, onChange }: Props) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  if (!options.length) return null;

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              {labels?.[opt] ?? opt.replace(/_/g, " ")}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
