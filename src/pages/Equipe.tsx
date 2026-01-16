import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Search, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  commission_rate: number | null;
  working_hours: Json | null;
}

interface WorkingHours {
  [key: string]: { start: string; end: string } | null;
}

const weekDays = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export default function Equipe() {
  const { profile: currentProfile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    commission_rate: "0",
    is_active: true,
    working_hours: {} as WorkingHours,
  });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["team-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!currentProfile,
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!currentProfile,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-profiles"] });
      toast.success("Barbeiro atualizado!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao atualizar barbeiro");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfile(null);
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    const workingHours = (profile.working_hours as WorkingHours) || {};
    setFormData({
      commission_rate: (profile.commission_rate || 0).toString(),
      is_active: profile.is_active,
      working_hours: workingHours,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    updateMutation.mutate({
      id: editingProfile.id,
      updates: {
        commission_rate: parseFloat(formData.commission_rate) || 0,
        is_active: formData.is_active,
        working_hours: formData.working_hours,
      },
    });
  };

  const updateWorkingHours = (day: string, field: "start" | "end", value: string) => {
    setFormData((prev) => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...(prev.working_hours[day] || { start: "09:00", end: "18:00" }),
          [field]: value,
        },
      },
    }));
  };

  const toggleDayOff = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: prev.working_hours[day] ? null : { start: "09:00", end: "18:00" },
      },
    }));
  };

  const getRoleForUser = (userId: string) => {
    const role = userRoles.find((r) => r.user_id === userId);
    return role?.role || "barber";
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-semibold">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie os barbeiros e suas configurações
          </p>
        </div>

        <div className="card-elevated rounded-lg">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar barbeiro..."
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
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {profile.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{profile.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{profile.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          getRoleForUser(profile.user_id) === "admin"
                            ? "border-primary text-primary"
                            : ""
                        }
                      >
                        {getRoleForUser(profile.user_id) === "admin"
                          ? "Administrador"
                          : "Barbeiro"}
                      </Badge>
                    </TableCell>
                    <TableCell>{profile.commission_rate || 0}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={profile.is_active ? "default" : "secondary"}
                        className={profile.is_active ? "bg-success/20 text-success" : ""}
                      >
                        {profile.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(profile)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filteredProfiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum barbeiro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">
                Editar Barbeiro: {editingProfile?.full_name}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm text-muted-foreground">Comissão (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_rate: e.target.value })
                  }
                />
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

              <div>
                <label className="text-sm text-muted-foreground mb-3 block flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horários de Trabalho
                </label>
                <div className="space-y-3">
                  {weekDays.map((day) => (
                    <div
                      key={day.key}
                      className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                    >
                      <Switch
                        checked={!!formData.working_hours[day.key]}
                        onCheckedChange={() => toggleDayOff(day.key)}
                      />
                      <span className="w-20 text-sm">{day.label}</span>
                      {formData.working_hours[day.key] ? (
                        <>
                          <Input
                            type="time"
                            value={formData.working_hours[day.key]?.start || "09:00"}
                            onChange={(e) =>
                              updateWorkingHours(day.key, "start", e.target.value)
                            }
                            className="w-24"
                          />
                          <span className="text-muted-foreground">até</span>
                          <Input
                            type="time"
                            value={formData.working_hours[day.key]?.end || "18:00"}
                            onChange={(e) =>
                              updateWorkingHours(day.key, "end", e.target.value)
                            }
                            className="w-24"
                          />
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">Folga</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" className="gold-gradient">
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
