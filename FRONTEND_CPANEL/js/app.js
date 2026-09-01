/**
 * LÓGICA PRINCIPAL DO DASHBOARD - CONVERSOR DE ARQUIVOS DDM
 * Gerencia seleção de instituição, upload drag-and-drop, conversão e histórico.
 */

const HISTORY_KEY = "processing_history";
const SELECTED_INSTITUTION_KEY = "selected_institution";

let selectedInstitution = "";
let webhookUrl = "";
let institutionsMap = {};
let fileQueue = [];
let isUploading = false;
let historyData = [];

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  await loadInstitutions();
  loadHistory();
  setupEventListeners();
}

// Carrega lista de instituições e webhooks da API ou Fallback
async function loadInstitutions() {
  const selectEl = document.getElementById("institution-select");
  if (!selectEl) return;

  try {
    const res = await fetch("api/institutions.php");
    const json = await res.json();

    selectEl.innerHTML = '<option value="">Selecione uma instituição</option>';

    if (json.success && Array.isArray(json.data)) {
      json.data.forEach((inst) => {
        institutionsMap[inst.id] = inst;
        const opt = document.createElement("option");
        opt.value = inst.id;
        opt.textContent = inst.name;
        selectEl.appendChild(opt);
      });
    }
  } catch (err) {
    console.warn("Usando instituições padrão locais:", err);
  }

  // Restaura seleção anterior
  const storedInst = localStorage.getItem(SELECTED_INSTITUTION_KEY);
  if (storedInst && institutionsMap[storedInst]) {
    selectEl.value = storedInst;
    handleInstitutionChange(storedInst);
  }
}

function handleInstitutionChange(instId) {
  selectedInstitution = instId;
  localStorage.setItem(SELECTED_INSTITUTION_KEY, instId);

  const instData = institutionsMap[instId];
  webhookUrl = instData ? instData.webhookUrl || "" : "";

  const alertNoWebhook = document.getElementById("alert-no-webhook");
  if (alertNoWebhook) {
    alertNoWebhook.style.display = "none";
  }

  updateProcessButtonState();
}

function setupEventListeners() {
  const selectEl = document.getElementById("institution-select");
  if (selectEl) {
    selectEl.addEventListener("change", (e) => handleInstitutionChange(e.target.value));
  }

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => {
      if (!isUploading) fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("drag-active");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("drag-active");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    });
  }

  const processBtn = document.getElementById("btn-process");
  if (processBtn) {
    processBtn.addEventListener("click", processFiles);
  }

  const clearBtn = document.getElementById("btn-clear-history");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearHistory);
  }
}

function addFiles(filesList) {
  const validExtensions = [".xlsx", ".xls", ".txt", ".csv", ".ods"];
  const invalidFiles = [];
  const addedFiles = [];

  Array.from(filesList).forEach((file) => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validExtensions.includes(ext)) {
      invalidFiles.push(file.name);
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      showToast("Arquivo muito grande", `${file.name} excede o limite de 30 MB.`, "error");
      return;
    }

    const exists = fileQueue.some((f) => f.file.name === file.name && f.file.size === file.size);
    if (!exists) {
      const item = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        file: file,
        status: "idle", // idle, uploading, success, error
        progress: 0,
        downloadUrl: null,
        downloadFileName: null,
        errorMessage: null
      };
      fileQueue.push(item);
      addedFiles.push(item);
    }
  });

  if (invalidFiles.length > 0) {
    showToast("Formato Inválido", `${invalidFiles.join(", ")} não aceitos.`, "error");
  }

  renderFileList();
  updateProcessButtonState();
}

function renderFileList() {
  const container = document.getElementById("selected-files-container");
  const listEl = document.getElementById("selected-files-list");
  const countEl = document.getElementById("selected-files-count");

  if (!container || !listEl) return;

  if (fileQueue.length === 0) {
    container.style.display = "none";
    return;
  }

  container.style.display = "block";
  if (countEl) countEl.textContent = `${fileQueue.length} arquivo(s) selecionado(s)`;

  listEl.innerHTML = "";

  fileQueue.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "file-item";

    let statusHtml = "";
    if (item.status === "uploading") {
      statusHtml = `<span style="color: var(--primary); font-size: 0.8125rem; font-weight:500;">Enviando...</span>`;
    } else if (item.status === "success") {
      statusHtml = `
        <button class="btn btn-primary btn-sm" onclick="triggerDownload('${item.downloadUrl}', '${item.downloadFileName}')">
          Baixar
        </button>
      `;
    } else if (item.status === "error") {
      statusHtml = `<span style="color: var(--destructive); font-size: 0.8125rem; font-weight:500;" title="${item.errorMessage}">Erro</span>`;
    } else {
      statusHtml = `
        <button class="btn btn-ghost btn-sm" onclick="removeFile(${index})" ${isUploading ? 'disabled' : ''}>
          ✕
        </button>
      `;
    }

    card.innerHTML = `
      <div class="file-item-header">
        <div class="file-info">
          <div>
            <div class="file-name">${escapeHtml(item.file.name)}</div>
            <div class="file-size">${formatFileSize(item.file.size)}</div>
          </div>
        </div>
        <div>${statusHtml}</div>
      </div>
      ${item.status === 'uploading' ? `
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${item.progress}%"></div>
        </div>
      ` : ''}
    `;

    listEl.appendChild(card);
  });
}

function removeFile(index) {
  fileQueue.splice(index, 1);
  renderFileList();
  updateProcessButtonState();
}

function updateProcessButtonState() {
  const processBtn = document.getElementById("btn-process");
  if (!processBtn) return;

  const pending = fileQueue.filter((f) => f.status !== "success").length;

  if (fileQueue.length === 0) {
    processBtn.disabled = true;
    processBtn.textContent = "Enviar e converter arquivos";
  } else if (!selectedInstitution) {
    processBtn.disabled = true;
    processBtn.textContent = "Selecione uma instituição primeiro";
  } else if (isUploading) {
    processBtn.disabled = true;
    processBtn.textContent = "Processando arquivos...";
  } else if (pending === 0) {
    processBtn.disabled = true;
    processBtn.textContent = "Todos os arquivos foram processados";
  } else {
    processBtn.disabled = false;
    processBtn.textContent = `Enviar e converter ${pending} arquivo(s)`;
  }
}

async function processFiles() {
  if (isUploading || fileQueue.length === 0 || !selectedInstitution) return;

  isUploading = true;
  updateProcessButtonState();

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < fileQueue.length; i++) {
    const item = fileQueue[i];
    if (item.status === "success") continue;

    item.status = "uploading";
    item.progress = 30;
    renderFileList();

    try {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("institution", selectedInstitution);
      formData.append("webhook_url", webhookUrl);

      item.progress = 60;
      renderFileList();

      const response = await fetch("api/convert_proxy.php", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro na resposta do servidor (${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      let filename = `${item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name}_convertido.csv`;
      const disposition = response.headers.get("content-disposition");
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) filename = match[1].replace(/['"]/g, "");
      }

      item.status = "success";
      item.progress = 100;
      item.downloadUrl = objectUrl;
      item.downloadFileName = filename;
      successCount++;

      // Registra no histórico
      saveHistoryItem({
        id: item.id,
        originalName: item.file.name,
        processedAt: new Date().toISOString(),
        status: "sucesso",
        downloadUrl: objectUrl,
        downloadFileName: filename,
        institutionId: selectedInstitution
      });

      // Baixa automaticamente
      triggerDownload(objectUrl, filename);

    } catch (err) {
      item.status = "error";
      item.errorMessage = err.message || "Falha ao processar arquivo";
      errorCount++;

      saveHistoryItem({
        id: item.id,
        originalName: item.file.name,
        processedAt: new Date().toISOString(),
        status: "erro",
        errorMessage: item.errorMessage,
        institutionId: selectedInstitution
      });
    }

    renderFileList();
  }

  isUploading = false;
  updateProcessButtonState();

  if (errorCount === 0) {
    showToast("Processamento concluído!", `${successCount} arquivo(s) convertido(s) com sucesso.`, "success");
  } else {
    showToast("Processamento com alertas", `${successCount} sucesso, ${errorCount} erro(s).`, "error");
  }
}

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "arquivo_convertido.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Gerenciamento de Histórico
async function loadHistory() {
  try {
    const res = await fetch("api/history.php");
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      historyData = json.data;
    } else {
      const local = localStorage.getItem(HISTORY_KEY);
      historyData = local ? JSON.parse(local) : [];
    }
  } catch (err) {
    const local = localStorage.getItem(HISTORY_KEY);
    historyData = local ? JSON.parse(local) : [];
  }
  renderHistoryTable();
}

function saveHistoryItem(item) {
  historyData.unshift(item);
  historyData = historyData.slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));

  // Envia para API
  fetch("api/history.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  }).catch(() => {});

  renderHistoryTable();
}

function clearHistory() {
  historyData = [];
  localStorage.removeItem(HISTORY_KEY);
  fetch("api/history.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "clear" })
  }).catch(() => {});
  renderHistoryTable();
  showToast("Histórico limpo", "Todos os registros foram removidos.", "info");
}

function renderHistoryTable() {
  const bodyEl = document.getElementById("history-table-body");
  const emptyEl = document.getElementById("history-empty");
  const tableContainer = document.getElementById("history-table-container");

  if (!bodyEl) return;

  if (historyData.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    if (tableContainer) tableContainer.style.display = "none";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (tableContainer) tableContainer.style.display = "block";

  bodyEl.innerHTML = "";

  historyData.forEach((item) => {
    const tr = document.createElement("tr");
    const isSuccess = item.status === "sucesso" || item.status === "success";

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap: 0.5rem;">
          <span style="font-weight: 500;">${escapeHtml(item.originalName)}</span>
        </div>
      </td>
      <td style="color: var(--muted-foreground);">${formatDate(item.processedAt)}</td>
      <td>
        ${isSuccess 
          ? '<span class="badge badge-success">Sucesso</span>'
          : '<span class="badge" style="background:#fef2f2; color:#ef4444;">Erro</span>'}
      </td>
      <td style="text-align: right;">
        ${isSuccess && item.downloadUrl ? `
          <button class="btn btn-outline btn-sm" onclick="triggerDownload('${item.downloadUrl}', '${item.downloadFileName || 'arquivo.csv'}')">
            Baixar
          </button>
        ` : `<span style="font-size:0.75rem; color:var(--muted-foreground);">${escapeHtml(item.errorMessage || '—')}</span>`}
      </td>
    `;

    bodyEl.appendChild(tr);
  });
}

// Utilitários
function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).format(d);
  } catch (e) {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(title, message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";

  let iconColor = "var(--primary)";
  if (type === "error") iconColor = "var(--destructive)";
  if (type === "success") iconColor = "var(--success)";

  toast.innerHTML = `
    <div style="flex:1;">
      <div style="font-weight:600; font-size:0.875rem;">${escapeHtml(title)}</div>
      <div style="font-size:0.8125rem; color:var(--muted-foreground);">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
