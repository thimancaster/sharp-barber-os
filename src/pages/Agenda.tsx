import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { AppointmentModal } from "@/components/calendar/AppointmentModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const locales = { "pt-BR": ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
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

const statusColors: Record<string, string> = {
  scheduled: "#3b82f6",
  confirmed: "#10b981",
  in_progress: "#eab308",
  completed: "#22c55e",
  cancelled: "#ef4444",
  no_show: "#f97316",
};

export default function Agenda() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          client:clients(name),
          service:services(name),
          barber:profiles!appointments_barber_id_fkey(full_name)
        `)
        .order("start_time", { ascending: true });

      // If not admin, only show own appointments
      if (!isAdmin && profile?.id) {
        query = query.eq("barber_id", profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar agendamento");
    },
  });

  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((apt) => ({
      id: apt.id,
      title: `${apt.client?.name || "Cliente"} - ${apt.service?.name || "Serviço"}`,
      start: new Date(apt.start_time),
      end: new Date(apt.end_time),
      clientName: apt.client?.name || "Cliente",
      serviceName: apt.service?.name || "Serviço",
      barberName: apt.barber?.full_name || "Barbeiro",
      status: apt.status,
      price: Number(apt.price),
    }));
  }, [appointments]);

  const handleEventSelect = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      updateAppointmentMutation.mutate({
        id: event.id,
        updates: {
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        },
      });
    },
    [updateAppointmentMutation]
  );

  const handleStatusChange = useCallback(
    (id: string, status: string) => {
      updateAppointmentMutation.mutate({ id, updates: { status } });
      setIsModalOpen(false);
    },
    [updateAppointmentMutation]
  );

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: statusColors[event.status] || statusColors.scheduled,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Agenda" subtitle={isAdmin ? "Visualize todos os agendamentos" : "Seus agendamentos"} />
      <main className="flex-1 p-6">

        <div className="card-elevated rounded-lg p-4">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <DnDCalendar
              localizer={localizer}
              events={events}
              defaultView={Views.WEEK}
              views={[Views.DAY, Views.WEEK, Views.MONTH]}
              step={30}
              timeslots={2}
              min={new Date(0, 0, 0, 8, 0, 0)}
              max={new Date(0, 0, 0, 21, 0, 0)}
              style={{ height: 600 }}
              onSelectEvent={handleEventSelect}
              onEventDrop={handleEventDrop}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CalendarToolbar,
              }}
              messages={{
                today: "Hoje",
                previous: "Anterior",
                next: "Próximo",
                month: "Mês",
                week: "Semana",
                day: "Dia",
                agenda: "Agenda",
                noEventsInRange: "Não há agendamentos neste período",
              }}
            />
          )}
        </div>

        <AppointmentModal
          appointment={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusChange={handleStatusChange}
        />
      </main>
    </div>
  );
}
