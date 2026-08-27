import { Download, CheckCircle, AlertCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProcessedFile } from "./FileUpload";

interface ProcessingHistoryProps {
  history: ProcessedFile[];
  onClearHistory?: () => void;
}

export function ProcessingHistory({ history, onClearHistory }: ProcessingHistoryProps) {
  const handleDownload = (downloadUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Histórico de Processamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhum arquivo processado ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Faça upload de arquivos para ver o histórico aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Histórico de Processamento
        </CardTitle>
        {onClearHistory && history.length > 0 && (
          <Button variant="outline" size="sm" onClick={onClearHistory}>
            Limpar histórico
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Arquivo</TableHead>
                <TableHead className="font-semibold">Data/Hora</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium truncate max-w-[200px]">
                        {item.originalName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(item.processedAt)}
                  </TableCell>
                  <TableCell>
                    {item.status === "success" ? (
                      <div className="flex items-center gap-1.5 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Sucesso</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Erro</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === "success" && item.downloadUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownload(
                            item.downloadUrl!,
                            item.downloadFileName || "arquivo_convertido.csv"
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    ) : item.status === "error" ? (
                      <span className="text-sm text-muted-foreground">
                        {item.errorMessage || "Falha no processamento"}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
