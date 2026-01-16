import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building2, User, Bell } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-semibold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          {/* Barbearia Info */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl">Barbearia</CardTitle>
                  <CardDescription>
                    Informações da sua barbearia
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input defaultValue="Barbearia Prime" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Telefone</label>
                <Input defaultValue="(11) 99999-9999" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Endereço</label>
                <Input defaultValue="Rua das Flores, 123 - Centro" />
              </div>
            </CardContent>
          </Card>

          {/* User Profile */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl">Meu Perfil</CardTitle>
                  <CardDescription>
                    Suas informações pessoais
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome Completo</label>
                <Input defaultValue="Administrador" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Telefone</label>
                <Input defaultValue="(11) 99999-9999" />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl">Notificações</CardTitle>
                  <CardDescription>
                    Configurações de notificações
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: configurações de notificações por email e push.
              </p>
            </CardContent>
          </Card>

          <Button className="gold-gradient w-full">
            Salvar Alterações
          </Button>
        </div>
      </main>
    </div>
  );
}
