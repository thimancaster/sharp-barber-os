import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  sale_price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_alert: number | null;
  is_active: boolean;
}

interface ProductFormData {
  name: string;
  description: string;
  sale_price: string;
  cost_price: string;
  stock_quantity: string;
  min_stock_alert: string;
  is_active: boolean;
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  sale_price: "",
  cost_price: "",
  stock_quantity: "0",
  min_stock_alert: "5",
  is_active: true,
};

export default function Produtos() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!profile,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await supabase.from("products").insert({
        name: data.name,
        description: data.description || null,
        sale_price: parseFloat(data.sale_price),
        cost_price: parseFloat(data.cost_price),
        stock_quantity: parseInt(data.stock_quantity),
        min_stock_alert: parseInt(data.min_stock_alert) || 5,
        is_active: data.is_active,
        organization_id: profile!.organization_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao criar produto");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          description: data.description || null,
          sale_price: parseFloat(data.sale_price),
          cost_price: parseFloat(data.cost_price),
          stock_quantity: parseInt(data.stock_quantity),
          min_stock_alert: parseInt(data.min_stock_alert) || 5,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto removido!");
    },
    onError: () => {
      toast.error("Erro ao remover produto");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      sale_price: product.sale_price.toString(),
      cost_price: product.cost_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      min_stock_alert: (product.min_stock_alert || 5).toString(),
      is_active: product.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStockStatus = (product: Product) => {
    const minAlert = product.min_stock_alert || 5;
    if (product.stock_quantity === 0) {
      return { label: "Esgotado", variant: "destructive" as const, className: "bg-destructive/20 text-destructive" };
    }
    if (product.stock_quantity < minAlert) {
      return { label: "Baixo", variant: "outline" as const, className: "bg-warning/20 text-warning border-warning/30" };
    }
    return { label: "Normal", variant: "outline" as const, className: "bg-success/20 text-success border-success/30" };
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateProfit = (sale: number, cost: number) => {
    return ((sale - cost) / sale * 100).toFixed(1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Produtos" subtitle="Gerencie o estoque de produtos da barbearia" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gold-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Descrição</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Preço Venda (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.sale_price}
                        onChange={(e) =>
                          setFormData({ ...formData, sale_price: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Preço Custo (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cost_price}
                        onChange={(e) =>
                          setFormData({ ...formData, cost_price: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Estoque Atual</label>
                      <Input
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, stock_quantity: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Alerta Mín.</label>
                      <Input
                        type="number"
                        value={formData.min_stock_alert}
                        onChange={(e) =>
                          setFormData({ ...formData, min_stock_alert: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">Ativo</label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="gold-gradient">
                      {editingProduct ? "Salvar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="card-elevated rounded-lg">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Preço Custo</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const isLowStock = product.stock_quantity < (product.min_stock_alert || 5);
                  
                  return (
                    <TableRow 
                      key={product.id}
                      className={cn(
                        product.stock_quantity === 0 && "bg-destructive/5",
                        isLowStock && product.stock_quantity > 0 && "bg-warning/5"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            product.stock_quantity === 0 
                              ? "bg-destructive/10" 
                              : isLowStock 
                                ? "bg-warning/10" 
                                : "bg-primary/10"
                          )}>
                            <Package className={cn(
                              "h-5 w-5",
                              product.stock_quantity === 0 
                                ? "text-destructive" 
                                : isLowStock 
                                  ? "text-warning" 
                                  : "text-primary"
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{product.name}</p>
                              {isLowStock && (
                                <AlertTriangle className={cn(
                                  "h-4 w-4",
                                  product.stock_quantity === 0 ? "text-destructive" : "text-warning"
                                )} />
                              )}
                            </div>
                            {product.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        R$ {product.sale_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        R$ {product.cost_price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="text-success font-medium">
                          {calculateProfit(product.sale_price, product.cost_price)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-medium",
                          product.stock_quantity === 0 && "text-destructive",
                          isLowStock && product.stock_quantity > 0 && "text-warning"
                        )}>
                          {product.stock_quantity} un.
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={stockStatus.variant}
                          className={stockStatus.className}
                        >
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
