<?php
/**
 * API REST para Historico de Processamento
 * Registra e lista o historico de conversoes
 */

require_once __DIR__ . '/config.php';

$storageDir = __DIR__ . '/storage';
if (!file_exists($storageDir)) {
    @mkdir($storageDir, 0777, true);
}
$fallbackFile = $storageDir . '/history.json';

function getFallbackHistory($fallbackFile) {
    if (file_exists($fallbackFile)) {
        $data = json_decode(file_get_contents($fallbackFile), true);
        return is_array($data) ? $data : [];
    }
    return [];
}

function saveFallbackHistoryItem($fallbackFile, $item) {
    $current = getFallbackHistory($fallbackFile);
    array_unshift($current, $item);
    $current = array_slice($current, 0, 100);
    file_put_contents($fallbackFile, json_encode($current, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function clearFallbackHistory($fallbackFile) {
    file_put_contents($fallbackFile, json_encode([], JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];
$db = getDbConnection();

if ($method === 'GET') {
    $history = [];

    if ($db) {
        try {
            $stmt = $db->query("SELECT id, instituicao_id, nome_arquivo_original as originalName, 
                nome_arquivo_processado as processedName, tamanho_bytes as fileSize, status, 
                download_url as downloadUrl, mensagem_erro as errorMessage, 
                criado_em as processedAt 
                FROM historico_processamento ORDER BY id DESC LIMIT 50");
            $history = $stmt->fetchAll();
        } catch (Exception $e) {
            $history = getFallbackHistory($fallbackFile);
        }
    } else {
        $history = getFallbackHistory($fallbackFile);
    }

    echo json_encode(["success" => true, "data" => $history], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $action = $data['action'] ?? 'add';

    if ($action === 'clear') {
        if ($db) {
            try {
                $db->exec("TRUNCATE TABLE historico_processamento");
            } catch (Exception $e) {}
        }
        clearFallbackHistory($fallbackFile);
        echo json_encode(["success" => true, "message" => "Histórico limpo com sucesso."]);
        exit;
    }

    $item = [
        "id" => uniqid('hist_'),
        "institutionId" => $data['institutionId'] ?? '',
        "originalName" => $data['originalName'] ?? 'arquivo.xlsx',
        "processedName" => $data['downloadFileName'] ?? 'arquivo_convertido.csv',
        "fileSize" => intval($data['fileSize'] ?? 0),
        "status" => $data['status'] ?? 'sucesso',
        "downloadUrl" => $data['downloadUrl'] ?? '',
        "errorMessage" => $data['errorMessage'] ?? null,
        "processedAt" => date('Y-m-d H:i:s')
    ];

    if ($db) {
        try {
            $stmt = $db->prepare("INSERT INTO historico_processamento 
                (instituicao_id, nome_arquivo_original, nome_arquivo_processado, tamanho_bytes, status, download_url, mensagem_erro, criado_em)
                VALUES (:inst, :orig, :proc, :size, :status, :url, :err, NOW())");
            $stmt->execute([
                ':inst' => $item['institutionId'],
                ':orig' => $item['originalName'],
                ':proc' => $item['processedName'],
                ':size' => $item['fileSize'],
                ':status' => $item['status'],
                ':url' => $item['downloadUrl'],
                ':err' => $item['errorMessage']
            ]);
        } catch (Exception $e) {
            saveFallbackHistoryItem($fallbackFile, $item);
        }
    } else {
        saveFallbackHistoryItem($fallbackFile, $item);
    }

    echo json_encode(["success" => true, "data" => $item], JSON_UNESCAPED_UNICODE);
    exit;
}
