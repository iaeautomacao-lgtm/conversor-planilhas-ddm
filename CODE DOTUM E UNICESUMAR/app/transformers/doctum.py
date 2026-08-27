from .base import BaseTransformer
from ..utils.text import normalize_header, clean_text
from ..utils.formatters import (
    formatar_cpf, formatar_telefones_multiplos, formatar_data_yyyymmdd, 
    formatar_valor, formatar_endereco, limpar_email
)

MAP_DOCTUM = {
    "MATRICULA": ["MATRÍCULA/RA", "MATRICULA", "RA"],
    "NOME ALUNO": ["NOME DO DEVEDOR/ALUNO", "NOME", "ALUNO"],
    "CURSO": ["CURSO", "NOME CURSO"],
    "CPF": ["CPF DO DEVEDOR/ALUNO", "CPF"],
    "DATA NASCIMENTO": ["DATA NASCIMENTO DEVEDOR/RESP FINANCEIRO", "NASC", "DATA NASCIMENTO"],
    "ENDEREÇO": ["ENDEREÇO DEVEDOR", "ENDERECO", "ENDEREÇO"],
    "BAIRRO": ["BAIRRO"],
    "CIDADE": ["CIDADE"],
    "CEP": ["CEP"],
    "ESTADO": ["ESTADO", "UF"],
    "TELEFONE": ["TELEFONE", "FONE"],
    "CELULAR": ["CELULAR"],
    "RESPONSÁVEL": ["RESPONSÁVEL FINANCEIRO", "RESPONSAVEL"],
    "REFERENCIA": ["REFERÊNCIA/ID", "REFERENCIA", "ID"],
    "DATA VENCIMENTO": ["DATA PARCELA", "DATA VENCIMENTO", "VENCIMENTO"],
    "VALOR PARCELA": ["VALOR PARCELA", "VALOR"],
    "EMAIL": ["EMAIL", "E-MAIL"]
}

class DoctumTransformer(BaseTransformer):
    def __init__(self):
        super().__init__("doctum", "DOCTUM")

    def transform(self, raw_rows: list, headers: list) -> list:
        headers_norm = [normalize_header(h) for h in headers]
        transformed_rows = []

        for row in raw_rows:
            filial_val = self.get_value(row, ["FILIAL"], headers_norm)
            tel_raw = self.get_value(row, MAP_DOCTUM["TELEFONE"], headers_norm)
            cel_raw = self.get_value(row, MAP_DOCTUM["CELULAR"], headers_norm)

            out = {
                "__FILIAL__": filial_val,
                "MATRICULA": clean_text(self.get_value(row, MAP_DOCTUM["MATRICULA"], headers_norm)),
                "NOME ALUNO": clean_text(self.get_value(row, MAP_DOCTUM["NOME ALUNO"], headers_norm)),
                "CURSO": clean_text(self.get_value(row, MAP_DOCTUM["CURSO"], headers_norm)),
                "CPF": formatar_cpf(self.get_value(row, MAP_DOCTUM["CPF"], headers_norm)),
                "DATA NASCIMENTO": formatar_data_yyyymmdd(self.get_value(row, MAP_DOCTUM["DATA NASCIMENTO"], headers_norm)),
                "ENDEREÇO": formatar_endereco(self.get_value(row, MAP_DOCTUM["ENDEREÇO"], headers_norm)),
                "BAIRRO": clean_text(self.get_value(row, MAP_DOCTUM["BAIRRO"], headers_norm)),
                "CIDADE": clean_text(self.get_value(row, MAP_DOCTUM["CIDADE"], headers_norm)),
                "CEP": clean_text(self.get_value(row, MAP_DOCTUM["CEP"], headers_norm)),
                "ESTADO": clean_text(self.get_value(row, MAP_DOCTUM["ESTADO"], headers_norm)),
                "TELEFONE": formatar_telefones_multiplos(tel_raw)["tel1"],
                "CELULAR": formatar_telefones_multiplos(cel_raw)["tel1"],
                "RESPONSÁVEL": clean_text(self.get_value(row, MAP_DOCTUM["RESPONSÁVEL"], headers_norm)),
                "REFERENCIA": clean_text(self.get_value(row, MAP_DOCTUM["REFERENCIA"], headers_norm)),
                "DATA VENCIMENTO": formatar_data_yyyymmdd(self.get_value(row, MAP_DOCTUM["DATA VENCIMENTO"], headers_norm)),
                "VALOR PARCELA": formatar_valor(self.get_value(row, MAP_DOCTUM["VALOR PARCELA"], headers_norm)),
                "EMAIL": limpar_email(self.get_value(row, MAP_DOCTUM["EMAIL"], headers_norm))
            }

            transformed_rows.append(out)

        return transformed_rows
