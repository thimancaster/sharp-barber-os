import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Building2, User, Check, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const onboardingSchema = z.object({
  organizationName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  organizationSlug: z.string().min(2, "Slug deve ter no mínimo 2 caracteres").regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  organizationPhone: z.string().optional(),
  organizationAddress: z.string().optional(),
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  phone: z.string().optional(),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState<OnboardingData>({
    organizationName: "",
    organizationSlug: "",
    organizationPhone: "",
    organizationAddress: "",
    fullName: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingData, string>>>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user already has a profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        navigate("/dashboard");
        return;
      }

      // Pre-fill name from user metadata if available
      const userMetadata = session.user.user_metadata;
      if (userMetadata?.full_name) {
        setFormData(prev => ({ ...prev, fullName: userMetadata.full_name }));
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug from organization name
      if (field === "organizationName") {
        updated.organizationSlug = generateSlug(value);
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const stepFields: Record<number, (keyof OnboardingData)[]> = {
      1: ["organizationName", "organizationSlug"],
      2: ["fullName"],
    };

    const fieldsToValidate = stepFields[currentStep] || [];
    const newErrors: Partial<Record<keyof OnboardingData, string>> = {};

    for (const field of fieldsToValidate) {
      const result = onboardingSchema.shape[field].safeParse(formData[field]);
      if (!result.success) {
        newErrors[field] = result.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const response = await supabase.functions.invoke("complete-onboarding", {
        body: {
          organization: {
            name: formData.organizationName,
            slug: formData.organizationSlug,
            phone: formData.organizationPhone || null,
            address: formData.organizationAddress || null,
          },
          profile: {
            full_name: formData.fullName,
            phone: formData.phone || null,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Erro ao criar barbearia");
      }

      toast({
        title: "Barbearia criada!",
        description: "Bem-vindo ao BarberPro Prime.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar barbearia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg gold-gradient">
            <Scissors className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold gold-text-gradient">
              BarberPro
            </h1>
            <span className="text-xs text-muted-foreground">Prime</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center ${s < 3 ? "flex-1" : ""}`}
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    s < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="card-elevated">
          {step === 1 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-serif text-xl">Dados da Barbearia</CardTitle>
                    <CardDescription>
                      Informações básicas do seu estabelecimento
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome da Barbearia *</label>
                  <Input
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                    placeholder="Ex: Barbearia Premium"
                    className={errors.organizationName ? "border-destructive" : ""}
                  />
                  {errors.organizationName && (
                    <p className="text-sm text-destructive mt-1">{errors.organizationName}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Slug (URL) *</label>
                  <Input
                    value={formData.organizationSlug}
                    onChange={(e) => handleInputChange("organizationSlug", e.target.value)}
                    placeholder="ex: barbearia-premium"
                    className={errors.organizationSlug ? "border-destructive" : ""}
                  />
                  {errors.organizationSlug && (
                    <p className="text-sm text-destructive mt-1">{errors.organizationSlug}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Será usado no endereço da sua barbearia
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={formData.organizationPhone}
                    onChange={(e) => handleInputChange("organizationPhone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Endereço</label>
                  <Input
                    value={formData.organizationAddress}
                    onChange={(e) => handleInputChange("organizationAddress", e.target.value)}
                    placeholder="Rua das Flores, 123 - Centro"
                  />
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <User className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="font-serif text-xl">Seu Perfil</CardTitle>
                    <CardDescription>
                      Suas informações como administrador
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome Completo *</label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Seu nome completo"
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone Pessoal</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                    <Check className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="font-serif text-xl">Confirmação</CardTitle>
                    <CardDescription>
                      Revise os dados antes de criar
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Barbearia
                  </h4>
                  <div className="grid gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{formData.organizationName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slug:</span>
                      <span className="font-medium">{formData.organizationSlug}</span>
                    </div>
                    {formData.organizationPhone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone:</span>
                        <span className="font-medium">{formData.organizationPhone}</span>
                      </div>
                    )}
                    {formData.organizationAddress && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Endereço:</span>
                        <span className="font-medium">{formData.organizationAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-secondary-foreground" />
                    Administrador
                  </h4>
                  <div className="grid gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{formData.fullName}</span>
                    </div>
                    {formData.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone:</span>
                        <span className="font-medium">{formData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="p-6 pt-0 flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="flex-1 gold-gradient">
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 gold-gradient"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Criar Minha Barbearia
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
