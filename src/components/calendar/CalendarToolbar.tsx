import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ToolbarProps } from "react-big-calendar";

export function CalendarToolbar({ label, onNavigate, onView, view }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("NEXT")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={() => onNavigate("TODAY")}
        >
          Hoje
        </Button>
      </div>

      <h2 className="font-serif text-xl font-semibold capitalize">{label}</h2>

      <div className="flex items-center gap-1">
        <Button
          variant={view === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("day")}
        >
          Dia
        </Button>
        <Button
          variant={view === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("week")}
        >
          Semana
        </Button>
        <Button
          variant={view === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("month")}
        >
          Mês
        </Button>
      </div>
    </div>
  );
}
