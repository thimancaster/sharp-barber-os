import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign,
  Receipt,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  due_date: string;
  status: string;
  category: string | null;
}

interface ExpenseFormData {
  name: string;
  description: string;
  amount: string;
  due_date: string;
  status: string;
  category: string;
}

const initialFormData: ExpenseFormData = {
  name: "",
  description: "",
  amount: "",
  due_date: "",
  status: "pending",
  category: "outros",
};

const expenseCategories = [
  { value: "agua", label: "Água" },
  { value: "luz", label: "Luz" },
  { value: "internet", label: "Internet" },
  { value: "aluguel", label: "Aluguel" },
  { value: "material", label: "Material" },
  { value: "equipamento", label: "Equipamento" },
  { value: "outros", label: "Outros" },
];

export default function Financeiro() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);

  // Fetch expenses
  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!profile && isAdmin,
  });

  // Fetch today's appointments (completed) for revenue
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["today-revenue"],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const { data, error } = await supabase
        .from("appointments")
        .select("price, status")
        .gte("start_time", startOfDay)
        .lte("start_time", endOfDay)
        .eq("status", "completed");
      if (error) throw error;
      return data;
    },
    enabled: !!profile && isAdmin,
  });

  // Fetch barbers with their commissions
  const { data: barbers = [] } = useQuery({
    queryKey: ["barbers-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          commission_rate
        `)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!profile && isAdmin,
  });

  // Fetch appointments for commission calculation (last 30 days)
  const { data: recentAppointments = [] } = useQuery({
    queryKey: ["recent-appointments-commissions"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from("appointments")
        .select("barber_id, price, status")
        .gte("start_time", thirtyDaysAgo.toISOString())
        .eq("status", "completed");
      if (error) throw error;
      return data;
    },
    enabled: !!profile && isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const { error } = await supabase.from("expenses").insert({
        name: data.name,
        description: data.description || null,
        amount: parseFloat(data.amount),
        due_date: data.due_date,
        status: data.status,
        category: data.category,
        organization_id: profile!.organization_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Despesa criada com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao criar despesa");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExpenseFormData }) => {
      const { error } = await supabase
        .from("expenses")
        .update({
          name: data.name,
          description: data.description || null,
          amount: parseFloat(data.amount),
          due_date: data.due_date,
          status: data.status,
          category: data.category,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Despesa atualizada!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao atualizar despesa");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Despesa removida!");
    },
    onError: () => {
      toast.error("Erro ao remover despesa");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
    setFormData(initialFormData);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      description: expense.description || "",
      amount: expense.amount.toString(),
      due_date: expense.due_date,
      status: expense.status,
      category: expense.category || "outros",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Calculations
  const todayRevenue = todayAppointments.reduce((sum, apt) => sum + Number(apt.price), 0);
  const pendingExpenses = expenses.filter(e => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = expenses.filter(e => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);
  const estimatedProfit = todayRevenue - pendingExpenses;

  // Calculate commissions per barber
  const barberCommissions = barbers.map(barber => {
    const barberAppointments = recentAppointments.filter(a => a.barber_id === barber.id);
    const totalRevenue = barberAppointments.reduce((sum, a) => sum + Number(a.price), 0);
    const commissionRate = Number(barber.commission_rate) || 0;
    const commission = totalRevenue * (commissionRate / 100);
    
    return {
      ...barber,
      totalRevenue,
      commission,
      appointmentCount: barberAppointments.length,
    };
  });

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Header title="Financeiro" subtitle="Acesso restrito" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas administradores podem acessar o módulo financeiro.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Financeiro" subtitle="Gerencie as finanças da barbearia" />
      <main className="flex-1 p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="card-elevated">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Faturação Hoje
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    R$ {todayRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {todayAppointments.length} atendimentos concluídos
                  </p>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lucro Estimado
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    estimatedProfit >= 0 ? "text-success" : "text-destructive"
                  )}>
                    R$ {estimatedProfit.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vendas - Despesas pendentes
                  </p>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Despesas Pendentes
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    R$ {pendingExpenses.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {expenses.filter(e => e.status === "pending").length} contas a pagar
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick stats */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Resumo Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Despesas Pagas</span>
                    <span className="font-medium">R$ {paidExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Despesas Pendentes</span>
                    <span className="font-medium text-destructive">R$ {pendingExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-4">
                    <span className="font-medium">Total Despesas</span>
                    <span className="font-bold">R$ {(paidExpenses + pendingExpenses).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Comissões a Pagar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {barberCommissions.slice(0, 3).map((barber) => (
                    <div key={barber.id} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{barber.full_name}</span>
                      <span className="font-medium text-primary">
                        R$ {barber.commission.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-t pt-4">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-primary">
                      R$ {barberCommissions.reduce((sum, b) => sum + b.commission, 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center justify-between">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gold-gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Despesa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif">
                      {editingExpense ? "Editar Despesa" : "Nova Despesa"}
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
                        placeholder="Ex: Conta de Luz"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Descrição</label>
                      <Input
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Detalhes adicionais"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Valor (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) =>
                            setFormData({ ...formData, amount: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Vencimento</label>
                        <Input
                          type="date"
                          value={formData.due_date}
                          onChange={(e) =>
                            setFormData({ ...formData, due_date: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Categoria</label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Status</label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="gold-gradient">
                        {editingExpense ? "Salvar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="card-elevated rounded-lg">
              {loadingExpenses ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Despesa</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{expense.name}</p>
                              {expense.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {expense.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                        </TableCell>
                        <TableCell className="font-medium text-destructive">
                          R$ {expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(expense.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              expense.status === "paid"
                                ? "bg-success/20 text-success border-success/30"
                                : "bg-warning/20 text-warning border-warning/30"
                            )}
                          >
                            {expense.status === "paid" ? "Pago" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(expense)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(expense.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {expenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma despesa cadastrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Comissões dos Barbeiros (Últimos 30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barbeiro</TableHead>
                      <TableHead>Atendimentos</TableHead>
                      <TableHead>Faturamento</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {barberCommissions.map((barber) => (
                      <TableRow key={barber.id}>
                        <TableCell className="font-medium">{barber.full_name}</TableCell>
                        <TableCell>{barber.appointmentCount}</TableCell>
                        <TableCell>R$ {barber.totalRevenue.toFixed(2)}</TableCell>
                        <TableCell>{Number(barber.commission_rate) || 0}%</TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          R$ {barber.commission.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {barberCommissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum barbeiro encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
