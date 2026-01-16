import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Scissors, Calendar } from "lucide-react";

interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  clientName: string;
  serviceName: string;
  barberName: string;
  status: string;
  price: number;
}

interface AppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "No-Show",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  no_show: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export function AppointmentModal({ appointment, isOpen, onClose, onStatusChange }: AppointmentModalProps) {
  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Detalhes do Agendamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge className={statusColors[appointment.status]}>
              {statusLabels[appointment.status]}
            </Badge>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <User className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{appointment.clientName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <Scissors className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Serviço</p>
              <p className="font-medium">{appointment.serviceName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Data e Hora</p>
              <p className="font-medium">
                {format(appointment.start, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(appointment.start, "HH:mm")} - {format(appointment.end, "HH:mm")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Barbeiro</p>
              <p className="font-medium">{appointment.barberName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-serif text-xl font-semibold text-primary">
              R$ {appointment.price.toFixed(2)}
            </span>
          </div>

          <div className="pt-4 border-t border-border">
            <label className="text-sm text-muted-foreground mb-2 block">Alterar Status</label>
            <Select
              value={appointment.status}
              onValueChange={(value) => onStatusChange(appointment.id, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="no_show">No-Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
