import { supabase } from "@/integrations/supabase/client";

export interface Institution {
  id: string;
  name: string;
  webhookUrl?: string;
}

export const INSTITUTIONS: Institution[] = [
  { id: "bezerra-de-araujo-cba", name: "BEZERRA DE ARAUJO - CBA" },
  { id: "bezerra-de-araujo-faba", name: "BEZERRA DE ARAUJO - FABA" },
  { id: "bezerra-de-araujo-pos-siga", name: "BEZERRA DE ARAUJO - POS SIGA" },
  { id: "bezerra-de-araujo-pos", name: "BEZERRA DE ARAUJO - POS" },
  { id: "caduceu-sistema-1", name: "CADUCEU SISTEMA 1" },
  { id: "caduceu-sistema-2", name: "CADUCEU SISTEMA 2" },
  { id: "castelo-branco", name: "CASTELO BRANCO" },
  { id: "celso-lisboa", name: "CELSO LISBOA" },
  { id: "factum", name: "FACTUM" },
  { id: "isaac", name: "ISAAC" },
  { id: "isaac-negociacao", name: "ISAAC - NEGOCIAÇÃO" },
  { id: "isaac-ativos-telefone", name: "ISAAC ATIVOS - ativos_telefone" },
  { id: "isaac-ativos-negociacao", name: "ISAAC ATIVOS - NEGOCIAÇÃO" },
  { id: "isaac-ativos-2-inativos", name: "ISAAC ATIVOS 2 - ativos_inativos" },
  { id: "isaac-ativos-2-negociacao", name: "ISAAC ATIVOS 2 - NEGOCIAÇÃO" },
  { id: "multivix", name: "MULTIVIX" },
];

// Fetch all webhooks from database
export async function getInstitutionWebhooks(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("institution_webhooks")
    .select("institution_id, webhook_url");

  if (error) {
    console.error("Erro ao buscar webhooks:", error);
    return {};
  }

  const webhooks: Record<string, string> = {};
  data?.forEach((row) => {
    webhooks[row.institution_id] = row.webhook_url;
  });

  return webhooks;
}

// Save webhook to database (upsert)
export async function saveInstitutionWebhook(
  institutionId: string,
  webhookUrl: string
): Promise<boolean> {
  const { error } = await supabase
    .from("institution_webhooks")
    .upsert(
      { institution_id: institutionId, webhook_url: webhookUrl },
      { onConflict: "institution_id" }
    );

  if (error) {
    console.error("Erro ao salvar webhook:", error);
    return false;
  }

  return true;
}

// Get single webhook from database
export async function getInstitutionWebhook(
  institutionId: string
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("institution_webhooks")
    .select("webhook_url")
    .eq("institution_id", institutionId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar webhook:", error);
    return undefined;
  }

  return data?.webhook_url;
}

// Get all institutions with their webhooks
export async function getInstitutionsWithWebhooks(): Promise<
  (Institution & { webhookUrl?: string })[]
> {
  const webhooks = await getInstitutionWebhooks();
  return INSTITUTIONS.map((inst) => ({
    ...inst,
    webhookUrl: webhooks[inst.id],
  }));
}
