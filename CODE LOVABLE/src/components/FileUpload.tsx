import { useState, useCallback } from "react";
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type FileStatus = "idle" | "uploading" | "processing" | "downloading" | "success" | "error";

export interface ProcessedFile {
  id: string;
  originalName: string;
  processedAt: Date;
  status: "success" | "error";
  downloadUrl?: string;
  downloadFileName?: string;
  errorMessage?: string;
}

interface FileWithStatus {
  file: File;
  status: FileStatus;
  progress?: number;
  downloadUrl?: string;
  downloadFileName?: string;
  errorMessage?: string;
}

interface FileUploadProps {
  webhookUrl: string;
  institution: string;
  onFileProcessed?: (file: ProcessedFile) => void;
  disabled?: boolean;
}

export function FileUpload({ webhookUrl, institution, onFileProcessed, disabled }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): { valid: boolean; reason?: string } => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/plain",
      "text/csv",
      "application/vnd.oasis.opendocument.spreadsheet",
    ];
    const validExtensions = [".xlsx", ".xls", ".txt", ".csv", ".ods"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    
    const isValidType = validTypes.includes(file.type) || validExtensions.includes(extension);
    
    if (!isValidType) {
      return { valid: false, reason: "format" };
    }
    
    return { valid: true };
  };

  const addFiles = (newFiles: FileList) => {
    const validFiles: FileWithStatus[] = [];
    const invalidFormatFiles: string[] = [];

    Array.from(newFiles).forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        if (!files.some((f) => f.file.name === file.name && f.file.size === file.size)) {
          validFiles.push({ file, status: "idle" });
        }
      } else {
        invalidFormatFiles.push(file.name);
      }
    });

    if (invalidFormatFiles.length > 0) {
      toast({
        title: "Arquivos inválidos",
        description: `${invalidFormatFiles.join(", ")} - Formatos aceitos: .txt, .xls, .xlsx, .csv, .ods`,
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [files, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const getStatusLabel = (status: FileStatus): string => {
    switch (status) {
      case "uploading":
        return "Enviando...";
      case "processing":
        return "Processando...";
      case "downloading":
        return "Baixando...";
      case "success":
        return "Concluído";
      case "error":
        return "Erro";
      default:
        return "";
    }
  };

  const getProgressValue = (status: FileStatus): number => {
    switch (status) {
      case "uploading":
        return 25;
      case "processing":
        return 60;
      case "downloading":
        return 90;
      case "success":
        return 100;
      default:
        return 0;
    }
  };

  const uploadFileWithWebhook = async (fileItem: FileWithStatus, index: number) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "uploading" } : f))
    );

    try {
      const formData = new FormData();
      formData.append("file", fileItem.file);
      formData.append("filename", fileItem.file.name);

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
      });

      let downloadUrl: string | undefined;
      let downloadFileName: string | undefined;

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        const contentDisposition = response.headers.get("content-disposition");
        
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match) {
            downloadFileName = match[1].replace(/['"]/g, "");
          }
        }
        
        if (!downloadFileName) {
          const originalName = fileItem.file.name;
          const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
          downloadFileName = `${baseName}_convertido.csv`;
        }

        if (contentType && (
          contentType.includes("text/csv") || 
          contentType.includes("text/plain") || 
          contentType.includes("octet-stream") ||
          contentType.includes("spreadsheet") ||
          contentType.includes("excel")
        )) {
          const blob = await response.blob();
          downloadUrl = URL.createObjectURL(blob);
        }
      }

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "success", downloadUrl, downloadFileName } : f
        )
      );

      if (onFileProcessed) {
        onFileProcessed({
          id: `${Date.now()}-${index}`,
          originalName: fileItem.file.name,
          processedAt: new Date(),
          status: "success",
          downloadUrl,
          downloadFileName,
        });
      }
      return true;
    } catch (error) {
      console.error("Erro no upload:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar arquivo";
      
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "error", errorMessage } : f))
      );

      if (onFileProcessed) {
        onFileProcessed({
          id: `${Date.now()}-${index}`,
          originalName: fileItem.file.name,
          processedAt: new Date(),
          status: "error",
          errorMessage,
        });
      }
      return false;
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "success") continue;
      await uploadFileWithWebhook(files[i], i);
    }

    setIsUploading(false);

    const currentFiles = files;
    const successCount = currentFiles.filter((f) => f.status === "success" || f.status === "idle").length;
    const errorCount = currentFiles.filter((f) => f.status === "error").length;

    if (errorCount === 0) {
      toast({
        title: "Processamento concluído!",
        description: `${files.length} arquivo(s) convertido(s) com sucesso.`,
      });
    } else if (successCount > 0) {
      toast({
        title: "Processamento parcial",
        description: `${successCount} convertido(s), ${errorCount} com erro.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Erro no processamento",
        description: `${errorCount} arquivo(s) com erro.`,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (downloadUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const pendingFiles = files.filter((f) => f.status !== "success").length;
  const isProcessing = (status: FileStatus) => 
    status === "uploading" || status === "processing" || status === "downloading";

  return (
    <div className="space-y-6">
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          dragActive
            ? "border-primary bg-accent"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        } ${isUploading || disabled ? "pointer-events-none opacity-60" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">
            Arraste e solte seus arquivos aqui
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            ou clique para selecionar múltiplos arquivos
          </p>
          <input
            type="file"
            accept=".txt,.xls,.xlsx,.csv,.ods"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            multiple
            disabled={isUploading || disabled}
          />
          <label htmlFor="file-upload">
            <Button variant="default" size="lg" asChild disabled={isUploading || disabled}>
              <span className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>Selecionar arquivos</span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-6">
            Formatos aceitos: <span className="font-medium">.txt, .xls, .xlsx, .csv, .ods</span>
          </p>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {files.length} arquivo(s) selecionado(s)
            </p>
            {!isUploading && (
              <Button variant="ghost" size="sm" onClick={clearAllFiles} className="text-muted-foreground hover:text-foreground">
                Limpar todos
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {files.map((fileItem, index) => (
              <Card key={`${fileItem.file.name}-${index}`} className="border">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">
                          {fileItem.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileItem.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isProcessing(fileItem.status) && (
                        <div className="flex items-center gap-2 text-primary">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-xs font-medium">{getStatusLabel(fileItem.status)}</span>
                        </div>
                      )}
                      {fileItem.status === "success" && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-success" />
                          {fileItem.downloadUrl && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleDownload(fileItem.downloadUrl!, fileItem.downloadFileName || "arquivo_convertido.csv")}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar
                            </Button>
                          )}
                        </div>
                      )}
                      {fileItem.status === "error" && (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                          <span className="text-xs font-medium" title={fileItem.errorMessage}>Erro</span>
                        </div>
                      )}
                      {!isProcessing(fileItem.status) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {isProcessing(fileItem.status) && (
                    <div className="mt-3">
                      <Progress value={getProgressValue(fileItem.status)} className="h-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={uploadFiles}
        disabled={files.length === 0 || isUploading || pendingFiles === 0 || disabled}
        className="w-full"
        size="lg"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processando arquivos...
          </>
        ) : pendingFiles === 0 && files.length > 0 ? (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Todos os arquivos foram processados
          </>
        ) : (
          `Enviar e converter ${pendingFiles} arquivo(s)`
        )}
      </Button>
    </div>
  );
}
