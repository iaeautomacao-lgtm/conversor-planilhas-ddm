-- ============================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS MARIADB / MYSQL
-- SISTEMA CONVERSOR DE ARQUIVOS - GRUPO DDM
-- Compatível com phpMyAdmin / cPanel
-- ============================================================

CREATE DATABASE IF NOT EXISTS `conversor_ddm` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `conversor_ddm`;

-- ------------------------------------------------------------
-- Tabela: instituicoes
-- Armazena os registros das instituições e suas URLs de Webhook/API
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `instituicoes` (
  `id` VARCHAR(64) NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `webhook_url` TEXT DEFAULT NULL,
  `status` ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabela: historico_processamento
-- Armazena os arquivos convertidos e o status da operação
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `historico_processamento` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `instituicao_id` VARCHAR(64) DEFAULT NULL,
  `nome_arquivo_original` VARCHAR(255) NOT NULL,
  `nome_arquivo_processado` VARCHAR(255) DEFAULT NULL,
  `tamanho_bytes` BIGINT DEFAULT 0,
  `status` ENUM('sucesso', 'erro', 'processando') NOT NULL DEFAULT 'processando',
  `download_url` TEXT DEFAULT NULL,
  `mensagem_erro` TEXT DEFAULT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_instituicao` (`instituicao_id`),
  KEY `idx_criado_em` (`criado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabela: configuracoes
-- Armazena parâmetros globais do sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `configuracoes` (
  `chave` VARCHAR(100) NOT NULL,
  `valor` TEXT DEFAULT NULL,
  `descricao` VARCHAR(255) DEFAULT NULL,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`chave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- POPULAR INSTITUIÇÕES PADRÃO DO SISTEMA
-- ------------------------------------------------------------
INSERT INTO `instituicoes` (`id`, `nome`, `slug`, `webhook_url`) VALUES
('bezerra-de-araujo-cba', 'BEZERRA DE ARAUJO - CBA', 'bezerra-de-araujo-cba', ''),
('bezerra-de-araujo-faba', 'BEZERRA DE ARAUJO - FABA', 'bezerra-de-araujo-faba', ''),
('bezerra-de-araujo-pos-siga', 'BEZERRA DE ARAUJO - POS SIGA', 'bezerra-de-araujo-pos-siga', ''),
('bezerra-de-araujo-pos', 'BEZERRA DE ARAUJO - POS', 'bezerra-de-araujo-pos', ''),
('caduceu-sistema-1', 'CADUCEU SISTEMA 1', 'caduceu-sistema-1', ''),
('caduceu-sistema-2', 'CADUCEU SISTEMA 2', 'caduceu-sistema-2', ''),
('castelo-branco', 'CASTELO BRANCO', 'castelo-branco', ''),
('celso-lisboa', 'CELSO LISBOA', 'celso-lisboa', ''),
('factum', 'FACTUM', 'factum', ''),
('isaac', 'ISAAC', 'isaac', ''),
('isaac-negociacao', 'ISAAC - NEGOCIAÇÃO', 'isaac-negociacao', ''),
('isaac-ativos-telefone', 'ISAAC ATIVOS - ativos_telefone', 'isaac-ativos-telefone', ''),
('isaac-ativos-negociacao', 'ISAAC ATIVOS - NEGOCIAÇÃO', 'isaac-ativos-negociacao', ''),
('isaac-ativos-2-inativos', 'ISAAC ATIVOS 2 - ativos_inativos', 'isaac-ativos-2-inativos', ''),
('isaac-ativos-2-negociacao', 'ISAAC ATIVOS 2 - NEGOCIAÇÃO', 'isaac-ativos-2-negociacao', ''),
('multivix', 'MULTIVIX', 'multivix', '')
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

-- Parâmetros padrão
INSERT INTO `configuracoes` (`chave`, `valor`, `descricao`) VALUES
('limite_upload_mb', '30', 'Tamanho máximo permitido por arquivo em megabytes'),
('backend_python_url', 'http://127.0.0.1:8000', 'URL base do serviço backend em Python')
ON DUPLICATE KEY UPDATE `chave` = VALUES(`chave`);
