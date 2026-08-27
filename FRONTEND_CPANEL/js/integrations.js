/**
 * LÓGICA DA TELA DE INTEGRAÇÕES - CONVERSOR DE ARQUIVOS DDM
 * Gerencia edição, salvamento e teste de Webhooks por instituição.
 */

let institutionsData = [];

document.addEventListener("DOMContentLoaded", () => {
  loadIntegrations();
});

async function loadIntegrations() {
  const container = document.getElementById("integrations-list");
  if (!container) return;

  container.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--muted-foreground);">Carregando integrações...</div>';

  try {
    const res = await fetch("api/institutions.php");
    const json = await res.json();

    if (json.success && Array.isArray(json.data)) {
      institutionsData = json.data;
    }
  } catch (err) {
    console.warn("Falha ao carregar API de integrações, utilizando lista padrão:", err);
  }

  renderIntegrations();
}

function renderIntegrations() {
  const container = document.getElementById("integrations-list");
  if (!container) return;

  container.innerHTML = "";

  institutionsData.forEach((inst) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "1rem";

    const hasWebhook = !!(inst.webhookUrl && inst.webhookUrl.trim());

    card.innerHTML = `
      <div class="card-header" style="padding-bottom: 0.75rem;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 1.125rem;">
            🔗 ${escapeHtml(inst.name)}
          </div>
          ${hasWebhook 
            ? '<span class="badge badge-success">Configurado</span>' 
            : '<span class="badge badge-secondary">Não configurado</span>'}
        </div>
      </div>
      <div class="card-content" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="url-${inst.id}">URL do Webhook</label>
          <input 
            type="url" 
            id="url-${inst.id}" 
            class="text-input" 
            placeholder="https://exemplo.com/webhook" 
            value="${escapeHtml(inst.webhookUrl || '')}"
            oninput="onUrlInputChange('${inst.id}', this.value)"
          />
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-sm" id="btn-save-${inst.id}" onclick="saveWebhook('${inst.id}')">
            💾 Salvar
          </button>
          <button class="btn btn-outline btn-sm" id="btn-test-${inst.id}" onclick="testWebhook('${inst.id}')" ${!hasWebhook ? 'disabled' : ''}>
            ▶️ Testar
          </button>
        </div>
        <div id="test-result-${inst.id}" style="display: none;"></div>
      </div>
    `;

    container.appendChild(card);
  });
}

function onUrlInputChange(instId, value) {
  const inst = institutionsData.find((i) => i.id === instId);
  if (inst) inst.webhookUrl = value;

  const testBtn = document.getElementById(`btn-test-${instId}`);
  if (testBtn) {
    testBtn.disabled = !value.trim();
  }
}

async function saveWebhook(instId) {
  const inst = institutionsData.find((i) => i.id === instId);
  const input = document.getElementById(`url-${instId}`);
  const saveBtn = document.getElementById(`btn-save-${instId}`);

  const url = input ? input.value.trim() : (inst ? inst.webhookUrl : '');

  if (url) {
    try {
      new URL(url);
    } catch (e) {
      showToast("URL Inválida", "Insira uma URL válida (ex: https://...)", "error");
      return;
    }
  }

  if (saveBtn) saveBtn.disabled = true;

  try {
    const res = await fetch("api/institutions.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutionId: instId, webhookUrl: url })
    });
    const json = await res.json();

    if (json.success) {
      if (inst) inst.webhookUrl = url;
      showToast("Configuração salva!", "A URL do webhook foi atualizada.", "success");
      renderIntegrations();
    } else {
      showToast("Erro ao salvar", json.message || "Não foi possível salvar a configuração.", "error");
    }
  } catch (err) {
    showToast("Erro de conexão", "Não foi possível contatar o servidor.", "error");
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function testWebhook(instId) {
  const inst = institutionsData.find((i) => i.id === instId);
  const url = inst ? inst.webhookUrl : '';
  const resultBox = document.getElementById(`test-result-${instId}`);
  const testBtn = document.getElementById(`btn-test-${instId}`);

  if (!url) {
    showToast("URL não configurada", "Insira uma URL antes de testar.", "error");
    return;
  }

  if (resultBox) {
    resultBox.style.display = "block";
    resultBox.className = "alert alert-amber";
    resultBox.innerHTML = "⏳ Testando webhook...";
  }

  if (testBtn) testBtn.disabled = true;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        institution: inst ? inst.name : instId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const text = await response.text();

    if (resultBox) {
      if (response.ok) {
        resultBox.className = "alert";
        resultBox.style.backgroundColor = "rgba(16, 185, 129, 0.1)";
        resultBox.style.border = "1px solid rgba(16, 185, 129, 0.3)";
        resultBox.style.color = "#047857";
        resultBox.innerHTML = `
          <div>
            <strong>✅ Teste bem-sucedido! Status: ${response.status}</strong>
            <pre style="margin-top: 0.5rem; font-size: 0.75rem; background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 0.25rem; max-height: 80px; overflow: auto;">${escapeHtml(text.substring(0, 300))}</pre>
          </div>
        `;
        showToast("Teste concluído!", `Status HTTP ${response.status}`, "success");
      } else {
        resultBox.className = "alert alert-destructive";
        resultBox.innerHTML = `
          <div>
            <strong>⚠️ Resposta com Erro. Status: ${response.status}</strong>
            <pre style="margin-top: 0.5rem; font-size: 0.75rem; background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 0.25rem; max-height: 80px; overflow: auto;">${escapeHtml(text.substring(0, 300))}</pre>
          </div>
        `;
        showToast("Erro no teste", `Status HTTP ${response.status}`, "error");
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === "AbortError";
    const msg = isTimeout ? "Timeout: Webhook não respondeu em 8 segundos." : err.message;

    if (resultBox) {
      resultBox.className = "alert alert-destructive";
      resultBox.innerHTML = `<strong>❌ Falha no teste:</strong> ${escapeHtml(msg)}`;
    }
    showToast("Falha no teste", msg, "error");
  } finally {
    if (testBtn) testBtn.disabled = false;
  }
}
