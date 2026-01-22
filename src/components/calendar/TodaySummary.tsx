import { CalendarCheck, Clock, DollarSign, Users } from "lucide-react";

interface TodaySummaryProps {
  totalAppointments: number;
  confirmedCount: number;
  completedCount: number;
  totalRevenue: number;
}

export function TodaySummary({
  totalAppointments,
  confirmedCount,
  completedCount,
  totalRevenue,
}: TodaySummaryProps) {
  const stats = [
    {
      label: "Total Hoje",
      value: totalAppointments,
      icon: CalendarCheck,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Confirmados",
      value: confirmedCount,
      icon: Users,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Concluídos",
      value: completedCount,
      icon: Clock,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Receita",
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg"
        >
          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-2xl font-serif font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
