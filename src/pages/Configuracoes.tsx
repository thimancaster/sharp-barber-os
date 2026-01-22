import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, Bell, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface OrganizationData {
  name: string;
  phone: string;
  address: string;
  email: string;
}

interface ProfileData {
  full_name: string;
  phone: string;
}

export default function Configuracoes() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [orgData, setOrgData] = useState<OrganizationData>({
    name: "",
    phone: "",
    address: "",
    email: "",
  });

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    phone: "",
  });

  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch profile data
  const { data: currentProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", profile?.user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.user_id,
  });

  // Update form when data loads
  useEffect(() => {
    if (organization) {
      setOrgData({
        name: organization.name || "",
        phone: organization.phone || "",
        address: organization.address || "",
        email: organization.email || "",
      });
    }
  }, [organization]);

  useEffect(() => {
    if (currentProfile) {
      setProfileData({
        full_name: currentProfile.full_name || "",
        phone: currentProfile.phone || "",
      });
    }
  }, [currentProfile]);

  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (data: OrganizationData) => {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
          email: data.email || null,
        })
        .eq("id", organization?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Dados da barbearia atualizados!");
    },
    onError: () => {
      toast.error("Erro ao atualizar dados da barbearia");
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
        })
        .eq("id", currentProfile?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-profile"] });
      toast.success("Perfil atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil");
    },
  });

  const handleSaveAll = () => {
    if (isAdmin && organization) {
      updateOrgMutation.mutate(orgData);
    }
    if (currentProfile) {
      updateProfileMutation.mutate(profileData);
    }
  };

  const isLoading = isLoadingOrg || isLoadingProfile;
  const isSaving = updateOrgMutation.isPending || updateProfileMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Header title="Configurações" subtitle="Gerencie as configurações do sistema" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando configurações...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Configurações" subtitle="Gerencie as configurações do sistema" />
      <main className="flex-1 p-6">
        <div className="grid gap-6 max-w-2xl">
          {/* Barbearia Info - Only for admins */}
          {isAdmin && (
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-serif text-xl">Barbearia</CardTitle>
                    <CardDescription>Informações da sua barbearia</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Nome</label>
                  <Input
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    placeholder="Nome da barbearia"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Telefone</label>
                  <Input
                    value={orgData.phone}
                    onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={orgData.email}
                    onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                    placeholder="contato@barbearia.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Endereço</label>
                  <Input
                    value={orgData.address}
                    onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                    placeholder="Rua, número - Bairro, Cidade"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Profile */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl">Meu Perfil</CardTitle>
                  <CardDescription>Suas informações pessoais</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome Completo</label>
                <Input
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Telefone</label>
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications - Coming Soon */}
          <Card className="card-elevated opacity-75">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl">Notificações</CardTitle>
                  <CardDescription>Configurações de notificações</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: configurações de notificações por email e push.
              </p>
            </CardContent>
          </Card>

          <Button
            className="gold-gradient w-full"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
