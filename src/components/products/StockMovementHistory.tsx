import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  created_by_profile_id: string | null;
  products: {
    name: string;
  };
  profiles: {
    full_name: string;
  } | null;
}

interface StockMovementHistoryProps {
  productId?: string;
  limit?: number;
}

export function StockMovementHistory({ productId, limit = 20 }: StockMovementHistoryProps) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock-movements", productId, limit],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          products (name),
          profiles (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as StockMovement[];
    },
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "in":
        return <ArrowDownCircle className="h-4 w-4 text-success" />;
      case "out":
      case "sale":
        return <ArrowUpCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Settings className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "in":
        return { label: "Entrada", className: "bg-success/20 text-success border-success/30" };
      case "out":
        return { label: "Saída", className: "bg-destructive/20 text-destructive border-destructive/30" };
      case "sale":
        return { label: "Venda", className: "bg-primary/20 text-primary border-primary/30" };
      case "adjustment":
        return { label: "Ajuste", className: "bg-muted text-muted-foreground" };
      default:
        return { label: type, className: "" };
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhuma movimentação registrada
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data/Hora</TableHead>
          {!productId && <TableHead>Produto</TableHead>}
          <TableHead>Tipo</TableHead>
          <TableHead>Quantidade</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Responsável</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => {
          const movementLabel = getMovementLabel(movement.movement_type);
          return (
            <TableRow key={movement.id}>
              <TableCell className="text-muted-foreground">
                {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              {!productId && (
                <TableCell className="font-medium">
                  {movement.products?.name}
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  {getMovementIcon(movement.movement_type)}
                  <Badge variant="outline" className={movementLabel.className}>
                    {movementLabel.label}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <span className={cn(
                  "font-medium",
                  movement.quantity > 0 ? "text-success" : "text-destructive"
                )}>
                  {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {movement.reason || "-"}
                {movement.notes && (
                  <span className="block text-xs text-muted-foreground/70">
                    {movement.notes}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {movement.profiles?.full_name || "-"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
