from .base import BaseTransformer
from ..utils.text import normalize_header, clean_text, find_column_index
from ..utils.formatters import (
    formatar_cpf, formatar_telefones_multiplos, formatar_data_yyyymmdd, 
    formatar_valor, formatar_endereco, limpar_email, formatar_referencia
)

def formatar_matricula_unicesumar(valor):
    if valor is None:
        return '=""'
    try:
        s = str(int(valor)).strip()
    except Exception:
        s = str(valor).strip()
    if not s.isdigit() or len(s) < 2:
        return f'="{s}"'
    matricula = f"{s[:-1]}-{s[-1]}"
    return f'="{matricula}"'

def valor_menor_que_um(valor_formatado: str) -> bool:
    try:
        v = float(valor_formatado.replace('="', '').replace('"', '').replace(".", "").replace(",", "."))
        return v < 1.0
    except Exception:
        return True

MAP_UNICESUMAR = {
    "MATRICULA": ["MATRICULA", "RA"],
    "NOME ALUNO": ["NOME_COMPL", "NOME DO ALUNO", "NOME ALUNO", "NOME"],
    "CURSO": ["NOME", "CURSO", "NOME_CURSO", "NOME DO CURSO"],
    "CPF": ["CPF"],
    "DATA DE NASCIMENTO": ["DATA_NASC", "DATA DE NASCIMENTO"],
    "ENDEREÇO": ["ENDERECO", "ENDEREÇO"],
    "BAIRRO": ["BAIRRO"],
    "CIDADE": ["CIDADE"],
    "CEP": ["CEP"],
    "ESTADO": ["ESTADO", "UF"],
    "TELEFONE": ["TELEFONE", "FONE"],
    "CELULAR": ["CELULAR"],
    "RESPONSÁVEL": ["NOME_RESP", "RESPONSÁVEL", "RESPONSAVEL"],
    "REFERENCIA": ["COBRANCA", "REFERENCIA"],
    "DATA VENCIMENTO": ["DATA_VENCIMENTO", "DATA VENCIMENTO"],
    "VALOR PARCELA": ["VALOR_ABERTO", "VALOR PARCELA", "VALOR"],
    "EMAIL": ["E_MAIL", "EMAIL", "E-MAIL"]
}

class UnicesumarTransformer(BaseTransformer):
    def __init__(self):
        super().__init__("unicesumar", "UNICESUMAR")

    def transform(self, raw_rows: list, headers: list) -> list:
        headers_norm = [normalize_header(h) for h in headers]
        transformed_rows = []

        for row in raw_rows:
            v_val = formatar_valor(self.get_value(row, MAP_UNICESUMAR["VALOR PARCELA"], headers_norm))
            if valor_menor_que_um(v_val):
                continue

            tel_raw = self.get_value(row, MAP_UNICESUMAR["TELEFONE"], headers_norm)
            cel_raw = self.get_value(row, MAP_UNICESUMAR["CELULAR"], headers_norm)

            out = {
                "MATRICULA": formatar_matricula_unicesumar(self.get_value(row, MAP_UNICESUMAR["MATRICULA"], headers_norm)),
                "NOME ALUNO": clean_text(self.get_value(row, MAP_UNICESUMAR["NOME ALUNO"], headers_norm)),
                "CURSO": clean_text(self.get_value(row, MAP_UNICESUMAR["CURSO"], headers_norm)),
                "CPF": formatar_cpf(self.get_value(row, MAP_UNICESUMAR["CPF"], headers_norm)),
                "DATA DE NASCIMENTO": formatar_data_yyyymmdd(self.get_value(row, MAP_UNICESUMAR["DATA DE NASCIMENTO"], headers_norm)),
                "ENDEREÇO": formatar_endereco(self.get_value(row, MAP_UNICESUMAR["ENDEREÇO"], headers_norm)),
                "BAIRRO": clean_text(self.get_value(row, MAP_UNICESUMAR["BAIRRO"], headers_norm)),
                "CIDADE": clean_text(self.get_value(row, MAP_UNICESUMAR["CIDADE"], headers_norm)),
                "CEP": clean_text(self.get_value(row, MAP_UNICESUMAR["CEP"], headers_norm)),
                "ESTADO": clean_text(self.get_value(row, MAP_UNICESUMAR["ESTADO"], headers_norm)),
                "TELEFONE": formatar_telefones_multiplos(tel_raw)["tel1"],
                "CELULAR": formatar_telefones_multiplos(cel_raw)["tel1"],
                "RESPONSÁVEL": clean_text(self.get_value(row, MAP_UNICESUMAR["RESPONSÁVEL"], headers_norm)),
                "REFERENCIA": formatar_referencia(self.get_value(row, MAP_UNICESUMAR["REFERENCIA"], headers_norm)),
                "DATA VENCIMENTO": formatar_data_yyyymmdd(self.get_value(row, MAP_UNICESUMAR["DATA VENCIMENTO"], headers_norm)),
                "VALOR PARCELA": v_val,
                "EMAIL": limpar_email(self.get_value(row, MAP_UNICESUMAR["EMAIL"], headers_norm))
            }

            transformed_rows.append(out)

        return transformed_rows
