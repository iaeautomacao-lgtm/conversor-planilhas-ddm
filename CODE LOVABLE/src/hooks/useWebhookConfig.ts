import { useState, useEffect } from "react";

const STORAGE_KEY = "webhook_url";
const DEFAULT_URL = "https://n8napp.ddmsrv.com/webhook/backoffice-conversao";

export function useWebhookConfig() {
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || DEFAULT_URL;
  });

  const saveWebhookUrl = (url: string) => {
    localStorage.setItem(STORAGE_KEY, url);
    setWebhookUrl(url);
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setWebhookUrl(stored);
    }
  }, []);

  return { webhookUrl, saveWebhookUrl };
}
