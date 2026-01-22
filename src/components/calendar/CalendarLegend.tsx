const statusItems = [
  { label: "Agendado", color: "bg-blue-500" },
  { label: "Confirmado", color: "bg-emerald-500" },
  { label: "Em Andamento", color: "bg-yellow-500" },
  { label: "Concluído", color: "bg-green-500" },
  { label: "Cancelado", color: "bg-destructive" },
  { label: "No-Show", color: "bg-orange-500" },
];

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card border border-border rounded-lg">
      <span className="text-sm text-muted-foreground font-medium">Legenda:</span>
      {statusItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded ${item.color}`} />
          <span className="text-sm text-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
