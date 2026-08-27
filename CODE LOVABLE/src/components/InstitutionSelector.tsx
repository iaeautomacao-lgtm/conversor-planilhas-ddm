import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { INSTITUTIONS, getInstitutionWebhook } from "@/lib/institutions";
import { Link } from "react-router-dom";

interface InstitutionSelectorProps {
  selectedInstitution: string;
  onInstitutionChange: (institutionId: string) => void;
  webhookUrl?: string;
}

export function InstitutionSelector({
  selectedInstitution,
  onInstitutionChange,
  webhookUrl,
}: InstitutionSelectorProps) {
  const hasWebhook = !!webhookUrl?.trim();

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="institution-select">Instituição</Label>
        <Select value={selectedInstitution} onValueChange={onInstitutionChange}>
          <SelectTrigger id="institution-select" className="w-full bg-background">
            <SelectValue placeholder="Selecione uma instituição" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {INSTITUTIONS.map((institution) => (
              <SelectItem key={institution.id} value={institution.id}>
                {institution.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedInstitution && !hasWebhook && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Webhook não configurado — configure em{" "}
            <Link to="/integrations" className="underline font-medium hover:text-destructive-foreground">
              Configurações {">"} Integrações
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
