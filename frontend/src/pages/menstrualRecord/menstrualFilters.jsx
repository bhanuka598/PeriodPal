import React from "react";
import { Search } from "lucide-react";

const FLOW_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Light", value: "Light" },
  { label: "Medium", value: "Medium" },
  { label: "Heavy", value: "Heavy" },
];


export default function MenstrualFilters({
  flowFilter,
  searchTerm,
  onFlowChange,
  onSearchChange,
}) {
  return (
    <div className="mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-secondary-50 rounded-2xl p-1">
          {FLOW_OPTIONS.map((option) => {
            const isActive = flowFilter === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onFlowChange(option.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-secondary-900 shadow-sm border border-secondary-200"
                    : "text-secondary-500 hover:text-secondary-700"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative w-full xl:w-[320px]">
        <Search className="h-4 w-4 text-secondary-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search records..."
          className="w-full rounded-2xl border border-secondary-200 bg-white pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}