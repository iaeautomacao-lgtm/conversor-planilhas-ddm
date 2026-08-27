import logging

logger = logging.getLogger("etl-ddm-db")

def get_db_connection():
    try:
        import pymysql
        conn = pymysql.connect(
            host="localhost",
            user="root",
            password="",
            database="conversor_ddm",
            port=3306,
            charset="utf8mb4",
            autocommit=True
        )
        return conn
    except Exception as e:
        logger.debug("MariaDB/MySQL off-line ou não configurado localmente: %s", e)
        return None

def registrar_historico(institution_id: str, filename_orig: str, filename_proc: str, size_bytes: int, status: str, err_msg: str = None):
    conn = get_db_connection()
    if not conn:
        return
    try:
        with conn.cursor() as cursor:
            sql = """INSERT INTO historico_processamento 
                     (instituicao_id, nome_arquivo_original, nome_arquivo_processado, tamanho_bytes, status, mensagem_erro, criado_em)
                     VALUES (%s, %s, %s, %s, %s, %s, NOW())"""
            cursor.execute(sql, (institution_id, filename_orig, filename_proc, size_bytes, status, err_msg))
    except Exception as e:
        logger.error("Erro ao registrar histórico no MariaDB: %s", e)
    finally:
        conn.close()
