import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Plus } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
}

interface CalendarFiltersProps {
  barbers: Profile[];
  selectedBarber: string;
  onBarberChange: (barberId: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  isAdmin: boolean;
  onNewAppointment: () => void;
}

const statusOptions = [
  { value: "all", label: "Todos", color: "bg-muted" },
  { value: "scheduled", label: "Agendado", color: "bg-blue-500" },
  { value: "confirmed", label: "Confirmado", color: "bg-emerald-500" },
  { value: "in_progress", label: "Em Andamento", color: "bg-yellow-500" },
  { value: "completed", label: "Concluído", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelado", color: "bg-destructive" },
  { value: "no_show", label: "No-Show", color: "bg-orange-500" },
];

export function CalendarFilters({
  barbers,
  selectedBarber,
  onBarberChange,
  statusFilter,
  onStatusChange,
  isAdmin,
  onNewAppointment,
}: CalendarFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {isAdmin && (
          <Select value={selectedBarber} onValueChange={onBarberChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os barbeiros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {barbers.map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.color}`} />
                  {status.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button className="gold-gradient" onClick={onNewAppointment}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Agendamento
      </Button>
    </div>
  );
}
