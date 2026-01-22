import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar, Clock, User, Scissors } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Barber {
  id: string;
  full_name: string;
}

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentFormData) => void;
  clients: Client[];
  services: Service[];
  barbers: Barber[];
  isLoading: boolean;
}

export interface AppointmentFormData {
  client_id: string;
  service_id: string;
  barber_id: string;
  start_time: string;
  notes: string;
}

export function NewAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  clients,
  services,
  barbers,
  isLoading,
}: NewAppointmentModalProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    client_id: "",
    service_id: "",
    barber_id: "",
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: "",
  });

  const selectedService = services.find((s) => s.id === formData.service_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      client_id: "",
      service_id: "",
      barber_id: "",
      start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      notes: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              Cliente
            </label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <Scissors className="h-4 w-4" />
              Serviço
            </label>
            <Select
              value={formData.service_id}
              onValueChange={(value) => setFormData({ ...formData, service_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{service.name}</span>
                      <span className="text-primary ml-2">R$ {service.price.toFixed(2)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService && (
              <p className="text-xs text-muted-foreground mt-1">
                Duração: {selectedService.duration_minutes} minutos
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              Barbeiro
            </label>
            <Select
              value={formData.barber_id}
              onValueChange={(value) => setFormData({ ...formData, barber_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              Data e Hora
            </label>
            <Input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Observações
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações opcionais..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gold-gradient"
              disabled={!formData.client_id || !formData.service_id || !formData.barber_id || isLoading}
            >
              {isLoading ? "Salvando..." : "Criar Agendamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
