import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
}

interface StockMovementModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  profileId: string;
}

type MovementType = "in" | "out" | "adjustment";

const movementReasons: Record<MovementType, string[]> = {
  in: ["Compra", "Devolução", "Transferência", "Outro"],
  out: ["Venda", "Perda", "Doação", "Transferência", "Outro"],
  adjustment: ["Inventário", "Correção", "Outro"],
};

export function StockMovementModal({
  product,
  isOpen,
  onClose,
  organizationId,
  profileId,
}: StockMovementModalProps) {
  const queryClient = useQueryClient();
  const [movementType, setMovementType] = useState<MovementType>("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new Error("Quantidade inválida");
      }

      // Calculate new stock based on movement type
      let newStock = product.stock_quantity;
      let actualQuantity = qty;

      if (movementType === "in") {
        newStock += qty;
      } else if (movementType === "out") {
        if (qty > product.stock_quantity) {
          throw new Error("Quantidade maior que o estoque disponível");
        }
        newStock -= qty;
        actualQuantity = -qty;
      } else if (movementType === "adjustment") {
        actualQuantity = qty - product.stock_quantity;
        newStock = qty;
      }

      // Insert stock movement record
      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          organization_id: organizationId,
          product_id: product.id,
          quantity: actualQuantity,
          movement_type: movementType,
          reason: reason,
          notes: notes || null,
          created_by_profile_id: profileId,
        });

      if (movementError) throw movementError;

      // Update product stock quantity
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", product.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast.success("Movimentação registrada com sucesso!");
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar movimentação");
    },
  });

  const handleClose = () => {
    setMovementType("in");
    setQuantity("");
    setReason("");
    setNotes("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            Movimentação de Estoque
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 rounded-lg bg-secondary">
          <p className="text-sm text-muted-foreground">Produto</p>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Estoque atual: <span className="text-foreground font-medium">{product.stock_quantity} un.</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={movementType === "in" ? "default" : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3",
                  movementType === "in" && "gold-gradient"
                )}
                onClick={() => setMovementType("in")}
              >
                <ArrowDownCircle className="h-5 w-5" />
                <span className="text-xs">Entrada</span>
              </Button>
              <Button
                type="button"
                variant={movementType === "out" ? "default" : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3",
                  movementType === "out" && "bg-destructive hover:bg-destructive/90"
                )}
                onClick={() => setMovementType("out")}
              >
                <ArrowUpCircle className="h-5 w-5" />
                <span className="text-xs">Saída</span>
              </Button>
              <Button
                type="button"
                variant={movementType === "adjustment" ? "default" : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3",
                  movementType === "adjustment" && "bg-secondary-foreground text-secondary"
                )}
                onClick={() => setMovementType("adjustment")}
              >
                <Settings className="h-5 w-5" />
                <span className="text-xs">Ajuste</span>
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">
              {movementType === "adjustment" ? "Novo Estoque" : "Quantidade"}
            </label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={movementType === "adjustment" ? "Quantidade total" : "Quantidade"}
              required
            />
            {movementType === "adjustment" && quantity && (
              <p className="text-xs text-muted-foreground mt-1">
                Diferença: {parseInt(quantity) - product.stock_quantity > 0 ? "+" : ""}
                {parseInt(quantity) - product.stock_quantity} unidades
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Motivo</label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {movementReasons[movementType].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Observações (opcional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className={cn(
                movementType === "in" && "gold-gradient",
                movementType === "out" && "bg-destructive hover:bg-destructive/90"
              )}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
