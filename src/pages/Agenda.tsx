import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, isToday, startOfDay, endOfDay, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { TodaySummary } from "@/components/calendar/TodaySummary";
import { AppointmentModal } from "@/components/calendar/AppointmentModal";
import { NewAppointmentModal, type AppointmentFormData } from "@/components/calendar/NewAppointmentModal";
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
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          client:clients(name),
          service:services(name, duration_minutes),
          barber:profiles!appointments_barber_id_fkey(full_name)
        `)
        .order("start_time", { ascending: true });

      if (!isAdmin && profile?.id) {
        query = query.eq("barber_id", profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch barbers for filter
  const { data: barbers = [] } = useQuery({
    queryKey: ["barbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!profile && isAdmin,
  });

  // Fetch clients for new appointment
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch services for new appointment
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration_minutes")
        .eq("is_active", true)
        .order("name");
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

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const selectedService = services.find((s) => s.id === data.service_id);
      const startTime = new Date(data.start_time);
      const endTime = addMinutes(startTime, selectedService?.duration_minutes || 30);

      const { error } = await supabase.from("appointments").insert({
        client_id: data.client_id,
        service_id: data.service_id,
        barber_id: data.barber_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        price: selectedService?.price || 0,
        notes: data.notes || null,
        organization_id: profile!.organization_id,
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
      setIsNewModalOpen(false);
    },
    onError: () => {
      toast.error("Erro ao criar agendamento");
    },
  });

  // Filter events based on selected barber and status
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesBarber = selectedBarber === "all" || apt.barber_id === selectedBarber;
      const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
      return matchesBarber && matchesStatus;
    });
  }, [appointments, selectedBarber, statusFilter]);

  const events: CalendarEvent[] = useMemo(() => {
    return filteredAppointments.map((apt) => ({
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
  }, [filteredAppointments]);

  // Calculate today's summary
  const todaySummary = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const todayAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= todayStart && aptDate <= todayEnd;
    });

    return {
      total: todayAppointments.length,
      confirmed: todayAppointments.filter((apt) => apt.status === "confirmed").length,
      completed: todayAppointments.filter((apt) => apt.status === "completed").length,
      revenue: todayAppointments
        .filter((apt) => apt.status === "completed")
        .reduce((sum, apt) => sum + Number(apt.price), 0),
    };
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
        borderRadius: "6px",
        opacity: 0.95,
        color: "white",
        border: "none",
        display: "block",
        fontWeight: 500,
        fontSize: "0.75rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      },
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header 
        title="Agenda" 
        subtitle={isAdmin ? "Gerencie todos os agendamentos da barbearia" : "Seus agendamentos"} 
      />
      <main className="flex-1 p-6 space-y-6">
        {/* Today's Summary */}
        <TodaySummary
          totalAppointments={todaySummary.total}
          confirmedCount={todaySummary.confirmed}
          completedCount={todaySummary.completed}
          totalRevenue={todaySummary.revenue}
        />

        {/* Filters */}
        <CalendarFilters
          barbers={barbers}
          selectedBarber={selectedBarber}
          onBarberChange={setSelectedBarber}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          isAdmin={isAdmin}
          onNewAppointment={() => setIsNewModalOpen(true)}
        />

        {/* Calendar */}
        <div className="card-elevated rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="h-[650px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-muted-foreground text-sm">Carregando agenda...</p>
              </div>
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
              style={{ height: 650 }}
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

        {/* Legend */}
        <CalendarLegend />

        {/* View/Edit Appointment Modal */}
        <AppointmentModal
          appointment={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusChange={handleStatusChange}
        />

        {/* New Appointment Modal */}
        <NewAppointmentModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={(data) => createAppointmentMutation.mutate(data)}
          clients={clients}
          services={services}
          barbers={barbers.length > 0 ? barbers : (profile ? [{ id: profile.id, full_name: profile.full_name }] : [])}
          isLoading={createAppointmentMutation.isPending}
        />
      </main>
    </div>
  );
}
