import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, Key, MessageSquare, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Integration {
  id: string;
  name: string;
  webhook_url: string | null;
  api_key: string | null;
  is_active: boolean;
}

export default function Integracoes() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["n8n-integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("n8n_integrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Set initial values from first integration
      if (data.length > 0) {
        setWebhookUrl(data[0].webhook_url || "");
        setInstanceId(data[0].api_key || "");
      }
      
      return data as Integration[];
    },
    enabled: !!profile && isAdmin,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const integrationData = {
        name: "n8n WhatsApp Integration",
        webhook_url: webhookUrl || null,
        api_key: instanceId || null,
        is_active: true,
        organization_id: profile!.organization_id,
        created_by_profile_id: profile!.id,
      };

      if (integrations.length > 0) {
        const { error } = await supabase
          .from("n8n_integrations")
          .update({
            webhook_url: webhookUrl || null,
            api_key: instanceId || null,
          })
          .eq("id", integrations[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("n8n_integrations")
          .insert(integrationData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-integrations"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    },
  });

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast.error("Informe a URL do Webhook primeiro");
      return;
    }

    setIsTestingWebhook(true);
    setTestResult(null);

    const testPayload = {
      event: "test",
      timestamp: new Date().toISOString(),
      data: {
        message: "Teste de integração BarberPro Prime",
        organization_id: profile?.organization_id,
        test: true,
      },
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
        mode: "no-cors", // n8n might not have CORS enabled
      });

      // With no-cors, we can't read the response, but if no error, assume success
      setTestResult("success");
      toast.success("Teste enviado! Verifique o n8n para confirmar o recebimento.");
    } catch (error) {
      setTestResult("error");
      toast.error("Erro ao enviar teste. Verifique a URL do webhook.");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSave = () => {
    upsertMutation.mutate();
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Header title="Integrações" subtitle="Acesso restrito" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas administradores podem acessar as configurações de integração.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Integrações" subtitle="Configure as integrações com n8n e WhatsApp" />
      <main className="flex-1 p-6">

        <div className="grid gap-6 max-w-2xl">
          {/* n8n Webhook Configuration */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Webhook className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-serif text-xl">n8n Webhook</CardTitle>
                    <CardDescription>
                      URL do webhook para receber agendamentos
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    integrations[0]?.is_active
                      ? "bg-success/20 text-success border-success/30"
                      : ""
                  }
                >
                  {integrations[0]?.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Webhook URL para Agendamento
                </label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://seu-n8n.app.n8n.cloud/webhook/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cole aqui a URL do webhook do seu workflow n8n
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook || !webhookUrl}
                >
                  {isTestingWebhook ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Testar Webhook
                </Button>
                {testResult === "success" && (
                  <div className="flex items-center gap-1 text-success text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Enviado!
                  </div>
                )}
                {testResult === "error" && (
                  <div className="flex items-center gap-1 text-destructive text-sm">
                    <XCircle className="h-4 w-4" />
                    Falha
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Instance Configuration */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl">WhatsApp</CardTitle>
                  <CardDescription>
                    Configurações da instância do WhatsApp
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Instance ID WhatsApp
                </label>
                <Input
                  value={instanceId}
                  onChange={(e) => setInstanceId(e.target.value)}
                  placeholder="instance_123456"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID da instância do Evolution API ou similar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Key Configuration */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Key className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl">Informações</CardTitle>
                  <CardDescription>
                    Como funciona a integração
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  1. Configure um workflow no n8n com um nó Webhook como trigger.
                </p>
                <p>
                  2. Cole a URL do webhook acima.
                </p>
                <p>
                  3. Quando um cliente agendar via WhatsApp, o assistente de IA
                  enviará os dados para o n8n.
                </p>
                <p>
                  4. O n8n processará e criará o agendamento automaticamente.
                </p>
              </div>

              <div className="mt-4 p-4 bg-secondary rounded-lg">
                <p className="text-sm font-medium mb-2">Payload de Exemplo:</p>
                <pre className="text-xs text-muted-foreground overflow-x-auto">
{`{
  "event": "new_appointment",
  "client": {
    "name": "João Silva",
    "phone": "+5511999999999"
  },
  "service": "Corte + Barba",
  "barber": "Carlos",
  "datetime": "2024-01-15T14:30:00",
  "notes": "Preferência: degradê baixo"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            className="gold-gradient w-full"
            onClick={handleSave}
            disabled={upsertMutation.isPending}
          >
            {upsertMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Salvar Configurações
          </Button>
        </div>
      </main>
    </div>
  );
}
