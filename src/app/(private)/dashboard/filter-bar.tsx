"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  onFilterChange: (filter: string) => void;
  onYearChange: (year: string) => void;
  currentFilter: string;
  currentYear: string;
}

export default function FilterBar({
  onFilterChange,
  onYearChange,
  currentFilter,
  currentYear,
}: FilterBarProps) {
  const currentYear_num = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear_num - i);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex items-center gap-2 text-slate-400">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Period:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {["7days", "lastMonth", "year"].map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentFilter === filter
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {filter === "7days"
              ? "Last 7 Days"
              : filter === "lastMonth"
                ? "Last Month"
                : "Year"}
          </button>
        ))}
      </div>

      {currentFilter === "year" && (
        <Select value={currentYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
