import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { RecentAppointments } from "@/components/dashboard/RecentAppointments";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp 
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do seu negócio"
      />
      
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Faturamento do Mês"
            value="R$ 12.580"
            change="+12% em relação ao mês anterior"
            changeType="positive"
            icon={DollarSign}
          />
          <KPICard
            title="Atendimentos Hoje"
            value="18"
            change="4 em andamento"
            changeType="neutral"
            icon={Calendar}
          />
          <KPICard
            title="Clientes Ativos"
            value="342"
            change="+8 novos esta semana"
            changeType="positive"
            icon={Users}
          />
          <KPICard
            title="Taxa de Retorno"
            value="78%"
            change="+5% este mês"
            changeType="positive"
            icon={TrendingUp}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentAppointments />
          </div>
          
          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="card-elevated rounded-xl p-6">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                Serviços Populares
              </h3>
              <div className="space-y-4">
                {[
                  { name: "Corte + Barba", count: 45, percentage: 35 },
                  { name: "Corte Degradê", count: 38, percentage: 30 },
                  { name: "Barba", count: 28, percentage: 22 },
                  { name: "Corte Social", count: 16, percentage: 13 },
                ].map((service) => (
                  <div key={service.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{service.name}</span>
                      <span className="text-muted-foreground">{service.count} atendimentos</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full gold-gradient transition-all duration-500"
                        style={{ width: `${service.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-elevated rounded-xl p-6">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                Barbeiros Ativos
              </h3>
              <div className="space-y-3">
                {[
                  { name: "João Silva", appointments: 8, status: "Disponível" },
                  { name: "Maria Santos", appointments: 6, status: "Atendendo" },
                  { name: "Pedro Costa", appointments: 4, status: "Disponível" },
                ].map((barber) => (
                  <div
                    key={barber.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      <span className="font-medium text-foreground">{barber.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {barber.appointments} hoje
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
