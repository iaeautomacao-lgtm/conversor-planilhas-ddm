import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, PlayCircle, Loader2, CheckCircle, AlertCircle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { INSTITUTIONS, getInstitutionWebhooks, saveInstitutionWebhook } from "@/lib/institutions";

interface TestResult {
  status: "idle" | "testing" | "success" | "error";
  message?: string;
  responseBody?: string;
}

const Integrations = () => {
  const [webhooks, setWebhooks] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadWebhooks = async () => {
      setLoading(true);
      const data = await getInstitutionWebhooks();
      setWebhooks(data);
      setLoading(false);
    };
    loadWebhooks();
  }, []);

  const handleUrlChange = (institutionId: string, url: string) => {
    setWebhooks((prev) => ({
      ...prev,
      [institutionId]: url,
    }));
  };

  const handleSave = async (institutionId: string) => {
    const url = webhooks[institutionId]?.trim();
    
    if (url) {
      try {
        new URL(url);
      } catch {
        toast({
          title: "URL inválida",
          description: "Por favor, insira uma URL válida.",
          variant: "destructive",
        });
        return;
      }
    }

    setSavingStates((prev) => ({ ...prev, [institutionId]: true }));
    
    const success = await saveInstitutionWebhook(institutionId, url || "");
    
    setSavingStates((prev) => ({ ...prev, [institutionId]: false }));

    if (success) {
      toast({
        title: "Configuração salva!",
        description: "A URL do webhook foi atualizada com sucesso.",
      });
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    }
  };

  const handleTest = async (institutionId: string) => {
    const url = webhooks[institutionId]?.trim();
    
    if (!url) {
      toast({
        title: "URL não configurada",
        description: "Insira uma URL antes de testar.",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(url);
    } catch {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive",
      });
      return;
    }

    setTestResults((prev) => ({
      ...prev,
      [institutionId]: { status: "testing" },
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          institution: INSTITUTIONS.find((i) => i.id === institutionId)?.name,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      
      if (response.ok) {
        setTestResults((prev) => ({
          ...prev,
          [institutionId]: {
            status: "success",
            message: `Status: ${response.status} ${response.statusText}`,
            responseBody: responseText.substring(0, 500),
          },
        }));
        toast({
          title: "Teste bem-sucedido!",
          description: `Webhook respondeu com status ${response.status}.`,
        });
      } else {
        setTestResults((prev) => ({
          ...prev,
          [institutionId]: {
            status: "error",
            message: `Erro: ${response.status} ${response.statusText}`,
            responseBody: responseText.substring(0, 500),
          },
        }));
        toast({
          title: "Erro no teste",
          description: `Webhook retornou status ${response.status}.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      const isTimeout = errorMessage.includes("abort");
      
      setTestResults((prev) => ({
        ...prev,
        [institutionId]: {
          status: "error",
          message: isTimeout ? "Timeout: webhook não respondeu em 8 segundos" : errorMessage,
        },
      }));
      toast({
        title: "Falha no teste",
        description: isTimeout ? "Timeout de 8 segundos excedido." : errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar às Configurações
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Integrações</h1>
          <p className="text-muted-foreground">
            Configure as URLs de webhook para cada instituição
          </p>
        </div>

        <div className="space-y-4">
          {INSTITUTIONS.map((institution) => {
            const testResult = testResults[institution.id] || { status: "idle" };
            const hasWebhook = !!webhooks[institution.id]?.trim();
            const isSaving = savingStates[institution.id] || false;

            return (
              <Card key={institution.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      {institution.name}
                    </CardTitle>
                    {hasWebhook ? (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        Configurado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Não configurado</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`webhook-${institution.id}`}>URL do Webhook</Label>
                    <Input
                      id={`webhook-${institution.id}`}
                      type="url"
                      placeholder="https://exemplo.com/webhook"
                      value={webhooks[institution.id] || ""}
                      onChange={(e) => handleUrlChange(institution.id, e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave(institution.id)}
                      variant="default"
                      size="sm"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar
                    </Button>
                    <Button
                      onClick={() => handleTest(institution.id)}
                      variant="outline"
                      size="sm"
                      disabled={!hasWebhook || testResult.status === "testing"}
                    >
                      {testResult.status === "testing" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlayCircle className="mr-2 h-4 w-4" />
                      )}
                      Testar
                    </Button>
                  </div>

                  {testResult.status !== "idle" && testResult.status !== "testing" && (
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        testResult.status === "success"
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium mb-1">
                        {testResult.status === "success" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {testResult.message}
                      </div>
                      {testResult.responseBody && (
                        <pre className="mt-2 p-2 bg-background/50 rounded text-xs overflow-auto max-h-24">
                          {testResult.responseBody}
                        </pre>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Integrations;
