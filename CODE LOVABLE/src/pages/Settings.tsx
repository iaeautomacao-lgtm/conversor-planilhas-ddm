import { Link } from "react-router-dom";
import { ArrowLeft, Link2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>

        <div className="space-y-4">
          <Link to="/integrations">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Link2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Integrações</CardTitle>
                      <CardDescription>
                        Configure as URLs de webhook para cada instituição
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Settings;
