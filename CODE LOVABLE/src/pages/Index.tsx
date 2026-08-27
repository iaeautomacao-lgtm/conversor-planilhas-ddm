import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileUpload, ProcessedFile } from "@/components/FileUpload";
import { ProcessingHistory } from "@/components/ProcessingHistory";
import { InstitutionSelector } from "@/components/InstitutionSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, ExternalLink, Info } from "lucide-react";
import { getInstitutionWebhook } from "@/lib/institutions";
import logoGrupoDDM from "@/assets/logo-grupo-ddm.png";

const HISTORY_KEY = "processing_history";
const SELECTED_INSTITUTION_KEY = "selected_institution";

const Index = () => {
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [history, setHistory] = useState<ProcessedFile[]>([]);
  const [loadingWebhook, setLoadingWebhook] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      const storedInstitution = localStorage.getItem(SELECTED_INSTITUTION_KEY);
      if (storedInstitution) {
        setSelectedInstitution(storedInstitution);
        setLoadingWebhook(true);
        const url = await getInstitutionWebhook(storedInstitution);
        setWebhookUrl(url || "");
        setLoadingWebhook(false);
      }

      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        try {
          const parsed = JSON.parse(storedHistory);
          setHistory(parsed.map((item: ProcessedFile) => ({
            ...item,
            processedAt: new Date(item.processedAt),
          })));
        } catch (e) {
          console.error("Erro ao carregar histórico:", e);
        }
      }
    };

    loadInitialData();
  }, []);

  const handleInstitutionChange = async (institutionId: string) => {
    setSelectedInstitution(institutionId);
    localStorage.setItem(SELECTED_INSTITUTION_KEY, institutionId);
    setLoadingWebhook(true);
    const url = await getInstitutionWebhook(institutionId);
    setWebhookUrl(url || "");
    setLoadingWebhook(false);
  };

  const handleFileProcessed = (file: ProcessedFile) => {
    setHistory((prev) => {
      const updated = [file, ...prev].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Banner UNICESUMAR e DOCTUM */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>UNICESUMAR</strong> e <strong>DOCTUM</strong> acesse aqui:
            </span>
            <a 
              href="https://etl-ddm.onrender.com/docs#/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline hover:no-underline font-medium"
            >
              etl-ddm.onrender.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <img 
              src={logoGrupoDDM} 
              alt="Grupo DDM" 
              className="h-20 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Conversor de Arquivos
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload, processamento e download automático
              </p>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </Link>
        </header>

        {/* Upload Section */}
        <main className="space-y-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Upload de Arquivos</CardTitle>
              <CardDescription>
                Selecione arquivos <span className="font-medium text-foreground">.txt</span>, <span className="font-medium text-foreground">.xls</span> ou <span className="font-medium text-foreground">.xlsx</span> para conversão automática para <span className="font-medium text-foreground">.csv</span> ou <span className="font-medium text-foreground">.txt</span>
              </CardDescription>
              <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  <strong>Atenção:</strong> O upload está limitado a 30 MB por arquivo.{" "}
                  Para arquivos maiores, utilize{" "}
                  <a 
                    href="https://etl-ddm.onrender.com/docs#/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline font-medium"
                  >
                    etl-ddm.onrender.com
                  </a>
                </AlertDescription>
              </Alert>
            </CardHeader>
            <CardContent className="space-y-6">
              <InstitutionSelector
                selectedInstitution={selectedInstitution}
                onInstitutionChange={handleInstitutionChange}
                webhookUrl={webhookUrl}
              />
              <FileUpload 
                webhookUrl={webhookUrl}
                institution={selectedInstitution}
                onFileProcessed={handleFileProcessed}
                disabled={!webhookUrl || loadingWebhook}
              />
            </CardContent>
          </Card>

          {/* History Section */}
          <ProcessingHistory history={history} onClearHistory={handleClearHistory} />
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t space-y-3">
          <p className="text-center text-xs text-muted-foreground">
            Sistema de conversão de arquivos integrado ao n8n
          </p>
          <p className="text-center text-sm font-semibold text-amber-600 dark:text-amber-400">
            ⚠️ Para qualquer modificação na formatação dos arquivos ou inclusão, acione o setor de <strong>Automação e IA</strong>.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
