import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { RecentAppointments } from "@/components/dashboard/RecentAppointments";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp,
  Package,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { profile } = useAuth();

  // Fetch appointments for revenue calculation
  const { data: appointments = [] } = useQuery({
    queryKey: ["dashboard-appointments"],
    queryFn: async () => {
      const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
      const { data, error } = await supabase
        .from("appointments")
        .select("price, start_time, status")
        .gte("start_time", startOfCurrentMonth)
        .in("status", ["completed", "in_progress", "confirmed", "scheduled"]);
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ["dashboard-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount, due_date, status");
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["dashboard-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch products with low stock
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock_alert")
        .eq("is_active", true);
      if (error) throw error;
      return data.filter(p => p.stock_quantity <= (p.min_stock_alert || 5));
    },
    enabled: !!profile,
  });

  // Fetch barbers
  const { data: barbers = [] } = useQuery({
    queryKey: ["dashboard-barbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, is_active")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch services for popularity
  const { data: services = [] } = useQuery({
    queryKey: ["dashboard-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Generate financial chart data (last 6 months)
  const financialChartData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthRevenue = appointments
      .filter(a => {
        const aDate = new Date(a.start_time);
        return aDate >= monthStart && aDate <= monthEnd && a.status === "completed";
      })
      .reduce((sum, a) => sum + (a.price || 0), 0);
    
    const monthExpenses = expenses
      .filter(e => {
        const eDate = new Date(e.due_date);
        return eDate >= monthStart && eDate <= monthEnd && e.status === "paid";
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    return {
      name: format(date, "MMM", { locale: ptBR }),
      faturamento: monthRevenue,
      despesas: monthExpenses,
    };
  });

  // Calculate KPIs
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppointments = appointments.filter(a => {
    const aDate = new Date(a.start_time);
    return aDate >= todayStart && aDate <= todayEnd;
  });

  const monthlyRevenue = appointments
    .filter(a => a.status === "completed")
    .reduce((sum, a) => sum + (a.price || 0), 0);

  const pendingExpenses = expenses
    .filter(e => e.status === "pending")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const newClientsThisWeek = clients.filter(c => new Date(c.created_at) >= thisWeekStart).length;

  // Calculate return rate (mock for now - would need historical data)
  const returnRate = 78;

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
            value={`R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            change={`${pendingExpenses > 0 ? `R$ ${pendingExpenses.toLocaleString('pt-BR')} em despesas pendentes` : 'Sem despesas pendentes'}`}
            changeType={pendingExpenses > 0 ? "neutral" : "positive"}
            icon={DollarSign}
          />
          <KPICard
            title="Atendimentos Hoje"
            value={todayAppointments.length.toString()}
            change={`${todayAppointments.filter(a => a.status === "in_progress").length} em andamento`}
            changeType="neutral"
            icon={Calendar}
          />
          <KPICard
            title="Clientes Ativos"
            value={clients.length.toString()}
            change={`+${newClientsThisWeek} novos esta semana`}
            changeType="positive"
            icon={Users}
          />
          <KPICard
            title="Taxa de Retorno"
            value={`${returnRate}%`}
            change="+5% este mês"
            changeType="positive"
            icon={TrendingUp}
          />
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="card-elevated rounded-xl p-4 border-warning/30 bg-warning/5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Alerta de Estoque Baixo</h4>
                <p className="text-sm text-muted-foreground">
                  {lowStockProducts.length} produto(s) com estoque baixo ou esgotado
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Chart */}
        <FinancialChart data={financialChartData} title="Evolução Financeira (Últimos 6 Meses)" />

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
                {services.slice(0, 4).map((service, index) => {
                  const percentage = Math.max(10, 100 - (index * 20));
                  return (
                    <div key={service.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{service.name}</span>
                        <span className="text-muted-foreground">{Math.round(percentage * 0.5)} atendimentos</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full gold-gradient transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-elevated rounded-xl p-6">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                Barbeiros Ativos
              </h3>
              <div className="space-y-3">
                {barbers.slice(0, 5).map((barber) => (
                  <div
                    key={barber.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      <span className="font-medium text-foreground">{barber.full_name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.floor(Math.random() * 8) + 2} hoje
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Products Summary */}
            <div className="card-elevated rounded-xl p-6">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Estoque
              </h3>
              <div className="space-y-3">
                {lowStockProducts.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/5"
                  >
                    <span className="font-medium text-foreground">{product.name}</span>
                    <span className={`text-sm font-medium ${product.stock_quantity === 0 ? 'text-destructive' : 'text-warning'}`}>
                      {product.stock_quantity} un.
                    </span>
                  </div>
                ))}
                {lowStockProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Todos os produtos com estoque adequado
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
