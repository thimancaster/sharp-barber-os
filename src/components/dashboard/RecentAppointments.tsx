import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  time: string;
  barber: string;
  status: "scheduled" | "in_progress" | "completed";
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    clientName: "Carlos Mendes",
    service: "Corte + Barba",
    time: "10:00",
    barber: "João",
    status: "completed",
  },
  {
    id: "2",
    clientName: "Pedro Oliveira",
    service: "Corte Degradê",
    time: "11:00",
    barber: "João",
    status: "in_progress",
  },
  {
    id: "3",
    clientName: "Rafael Santos",
    service: "Barba",
    time: "11:30",
    barber: "Maria",
    status: "scheduled",
  },
  {
    id: "4",
    clientName: "Lucas Lima",
    service: "Corte Social",
    time: "14:00",
    barber: "João",
    status: "scheduled",
  },
  {
    id: "5",
    clientName: "Fernando Costa",
    service: "Corte + Barba + Sobrancelha",
    time: "15:00",
    barber: "Maria",
    status: "scheduled",
  },
];

const statusConfig = {
  scheduled: { label: "Agendado", class: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em Atendimento", class: "bg-primary/20 text-primary" },
  completed: { label: "Concluído", class: "bg-success/20 text-success" },
};

export function RecentAppointments() {
  return (
    <div className="card-elevated rounded-xl">
      <div className="border-b border-border p-6">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          Agendamentos de Hoje
        </h3>
        <p className="text-sm text-muted-foreground">
          Próximos atendimentos do dia
        </p>
      </div>
      <div className="divide-y divide-border">
        {mockAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/30"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-secondary text-foreground text-sm">
                  {appointment.clientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {appointment.clientName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {appointment.service}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-foreground">{appointment.time}</p>
                <p className="text-sm text-muted-foreground">
                  com {appointment.barber}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "min-w-[100px] justify-center",
                  statusConfig[appointment.status].class
                )}
              >
                {statusConfig[appointment.status].label}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
