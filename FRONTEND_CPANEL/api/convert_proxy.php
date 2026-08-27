<?php
/**
 * API Proxy de Conversao de Arquivos
 * Recebe o upload do frontend, encaminha para o Webhook/Python backend
 * e retorna o arquivo processado (.csv / .zip) diretamente para download.
 */

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método não permitido."]);
    exit;
}

$institutionId = $_POST['institution'] ?? $_POST['institution_id'] ?? '';
$webhookUrl = $_POST['webhook_url'] ?? '';

if (empty($webhookUrl)) {
    // Busca webhook no banco de dados se não foi passado no formulário
    $db = getDbConnection();
    if ($db && !empty($institutionId)) {
        try {
            $stmt = $db->prepare("SELECT webhook_url FROM instituicoes WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $institutionId]);
            $row = $stmt->fetch();
            if (!empty($row['webhook_url'])) {
                $webhookUrl = $row['webhook_url'];
            }
        } catch (Exception $e) {}
    }
}

if (empty($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Nenhum arquivo foi enviado."]);
    exit;
}

$uploadedFile = $_FILES['file'];

if (empty($webhookUrl)) {
    // Se não há webhook configurado, podemos acionar o backend Python local caso esteja ativo, ou retornar erro
    http_response_code(400);
    echo json_encode([
        "success" => false, 
        "message" => "Webhook não configurado para esta instituição. Vá em Configurações > Integrações."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Encaminha a requisição via cURL para o Webhook/Backend Python
$ch = curl_init();
$cfile = new CURLFile($uploadedFile['tmp_name'], $uploadedFile['type'], $uploadedFile['name']);

$postData = [
    'file' => $cfile,
    'filename' => $uploadedFile['name'],
    'institution' => strtoupper(str_replace('-', '_', $institutionId))
];

curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 120);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode >= 400) {
    http_response_code($httpCode > 0 ? $httpCode : 500);
    echo json_encode([
        "success" => false,
        "message" => "Erro ao se comunicar com o backend (" . ($curlError ?: "HTTP $httpCode") . ")"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$headerText = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Extrai cabeçalhos de tipo e disposição de arquivo
$contentType = "text/csv";
if (preg_match('/Content-Type:\s*([^\r\n]+)/i', $headerText, $matches)) {
    $contentType = trim($matches[1]);
}

$filename = "arquivo_convertido.csv";
if (preg_match('/filename[^;=\n]*=(([\'"]).*?\2|[^\;\n]*)/i', $headerText, $matches)) {
    $filename = trim(str_replace(['"', "'"], '', $matches[1]));
} else {
    $originalName = pathinfo($uploadedFile['name'], PATHINFO_FILENAME);
    $filename = $originalName . "_convertido.csv";
}

header("Content-Type: " . $contentType);
header("Content-Disposition: attachment; filename=\"" . $filename . "\"");
header("Content-Length: " . strlen($body));

echo $body;
exit;
