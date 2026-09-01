<?php
/**
 * Configuracao de Conexao com Banco de Dados MariaDB / MySQL
 * Compativel com cPanel
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configurações do Banco de Dados cPanel (Ajuste conforme suas credenciais cPanel)
define('DB_HOST', 'localhost');
define('DB_NAME', 'conversor_ddm');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3306');

// URL Padrão do Backend Python Unificado (Render / Servidor Python)
define('DEFAULT_PYTHON_BACKEND_URL', 'https://etl-ddm.onrender.com/convert');

function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";port=" . DB_PORT . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Se o banco de dados MySQL não estiver acessível, permite continuar com fallback local
        return null;
    }
}
