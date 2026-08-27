<?php
/**
 * API REST para Instituicoes e Webhooks
 * Retorna e atualiza as URLs de webhook das instituicoes
 */

require_once __DIR__ . '/config.php';

$storageDir = __DIR__ . '/storage';
if (!file_exists($storageDir)) {
    @mkdir($storageDir, 0777, true);
}
$fallbackFile = $storageDir . '/webhooks.json';

// Instituições padrão caso o banco esteja vazio
$defaultInstitutions = [
    ["id" => "bezerra-de-araujo-cba", "name" => "BEZERRA DE ARAUJO - CBA", "webhookUrl" => ""],
    ["id" => "bezerra-de-araujo-faba", "name" => "BEZERRA DE ARAUJO - FABA", "webhookUrl" => ""],
    ["id" => "bezerra-de-araujo-pos-siga", "name" => "BEZERRA DE ARAUJO - POS SIGA", "webhookUrl" => ""],
    ["id" => "bezerra-de-araujo-pos", "name" => "BEZERRA DE ARAUJO - POS", "webhookUrl" => ""],
    ["id" => "caduceu-sistema-1", "name" => "CADUCEU SISTEMA 1", "webhookUrl" => ""],
    ["id" => "caduceu-sistema-2", "name" => "CADUCEU SISTEMA 2", "webhookUrl" => ""],
    ["id" => "castelo-branco", "name" => "CASTELO BRANCO", "webhookUrl" => ""],
    ["id" => "celso-lisboa", "name" => "CELSO LISBOA", "webhookUrl" => ""],
    ["id" => "factum", "name" => "FACTUM", "webhookUrl" => ""],
    ["id" => "isaac", "name" => "ISAAC", "webhookUrl" => ""],
    ["id" => "isaac-negociacao", "name" => "ISAAC - NEGOCIAÇÃO", "webhookUrl" => ""],
    ["id" => "isaac-ativos-telefone", "name" => "ISAAC ATIVOS - ativos_telefone", "webhookUrl" => ""],
    ["id" => "isaac-ativos-negociacao", "name" => "ISAAC ATIVOS - NEGOCIAÇÃO", "webhookUrl" => ""],
    ["id" => "isaac-ativos-2-inativos", "name" => "ISAAC ATIVOS 2 - ativos_inativos", "webhookUrl" => ""],
    ["id" => "isaac-ativos-2-negociacao", "name" => "ISAAC ATIVOS 2 - NEGOCIAÇÃO", "webhookUrl" => ""],
    ["id" => "multivix", "name" => "MULTIVIX", "webhookUrl" => ""]
];

function getFallbackWebhooks($fallbackFile) {
    if (file_exists($fallbackFile)) {
        $data = json_decode(file_get_contents($fallbackFile), true);
        return is_array($data) ? $data : [];
    }
    return [];
}

function saveFallbackWebhook($fallbackFile, $id, $url) {
    $current = getFallbackWebhooks($fallbackFile);
    $current[$id] = $url;
    file_put_contents($fallbackFile, json_encode($current, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$db = getDbConnection();

if ($method === 'GET') {
    $webhooksMap = [];

    if ($db) {
        try {
            $stmt = $db->query("SELECT id, nome, webhook_url FROM instituicoes");
            $rows = $stmt->fetchAll();
            foreach ($rows as $row) {
                $webhooksMap[$row['id']] = $row['webhook_url'] ?? '';
            }
        } catch (Exception $e) {
            $webhooksMap = getFallbackWebhooks($fallbackFile);
        }
    } else {
        $webhooksMap = getFallbackWebhooks($fallbackFile);
    }

    $response = [];
    foreach ($defaultInstitutions as $inst) {
        $id = $inst['id'];
        $inst['webhookUrl'] = $webhooksMap[$id] ?? '';
        $response[] = $inst;
    }

    echo json_encode(["success" => true, "data" => $response, "webhooks" => $webhooksMap], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $institutionId = trim($data['institutionId'] ?? $data['id'] ?? '');
    $webhookUrl = trim($data['webhookUrl'] ?? $data['url'] ?? '');

    if (empty($institutionId)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID da instituição não informado."]);
        exit;
    }

    $success = false;

    if ($db) {
        try {
            $stmt = $db->prepare("INSERT INTO instituicoes (id, nome, slug, webhook_url) 
                VALUES (:id, :nome, :slug, :url) 
                ON DUPLICATE KEY UPDATE webhook_url = :url_update");
            $stmt->execute([
                ':id' => $institutionId,
                ':nome' => strtoupper(str_replace('-', ' ', $institutionId)),
                ':slug' => $institutionId,
                ':url' => $webhookUrl,
                ':url_update' => $webhookUrl
            ]);
            $success = true;
        } catch (Exception $e) {
            saveFallbackWebhook($fallbackFile, $institutionId, $webhookUrl);
            $success = true;
        }
    } else {
        saveFallbackWebhook($fallbackFile, $institutionId, $webhookUrl);
        $success = true;
    }

    echo json_encode([
        "success" => $success,
        "message" => $success ? "Webhook salvo com sucesso." : "Erro ao salvar webhook.",
        "institutionId" => $institutionId,
        "webhookUrl" => $webhookUrl
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
