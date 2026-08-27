from .base import BaseTransformer
from ..utils.text import normalize_header, clean_text
from ..utils.formatters import (
    formatar_cpf, formatar_cep, formatar_telefones_multiplos, 
    formatar_data_yyyymmdd, formatar_valor, formatar_endereco, limpar_email
)

class UnivassourasTransformer(BaseTransformer):
    def __init__(self):
        super().__init__("univassouras", "UNIVASSOURAS")

    def transform(self, raw_rows: list, headers: list) -> list:
        headers_norm = [normalize_header(h) for h in headers]
        transformed_rows = []

        for row in raw_rows:
            tel1 = self.get_value(row, ['TELEFONE 1', 'TELEFONE1', 'TELEFONE'], headers_norm)
            tel2 = self.get_value(row, ['TELEFONE 2', 'TELEFONE2', 'CELULAR'], headers_norm)

            out = {
                'MATRICULA': clean_text(self.get_value(row, ['RA', 'MATRICULA', 'MATRÍCULA'], headers_norm)),
                'NOME ALUNO': clean_text(self.get_value(row, ['ALUNO', 'NOME ALUNO', 'NOME'], headers_norm)),
                'CURSO': clean_text(self.get_value(row, ['CURSO', 'NOME CURSO'], headers_norm)),
                'CPF': formatar_cpf(self.get_value(row, ['CPF', 'CPF ALUNO'], headers_norm)),
                'DATA NASCIMENTO': formatar_data_yyyymmdd(self.get_value(row, ['DATA NASCIMENTO', 'NASC'], headers_norm)),
                'ENDEREÇO': formatar_endereco(self.get_value(row, ['RUA', 'ENDEREÇO', 'ENDERECO'], headers_norm)),
                'BAIRRO': clean_text(self.get_value(row, ['BAIRRO'], headers_norm)),
                'CIDADE': clean_text(self.get_value(row, ['CIDADE'], headers_norm)),
                'CEP': formatar_cep(self.get_value(row, ['CEP'], headers_norm)),
                'ESTADO': clean_text(self.get_value(row, ['ESTADO', 'UF'], headers_norm)),
                'TELEFONE': formatar_telefones_multiplos(tel1)["tel1"],
                'CELULAR': formatar_telefones_multiplos(tel2)["tel1"],
                'RESPONSÁVEL': clean_text(self.get_value(row, ['RESPONSAVEL FINANCEIRO', 'RESPONSÁVEL', 'RESPONSAVEL'], headers_norm)),
                'REFERENCIA': clean_text(self.get_value(row, ['REF', 'REFERENCIA', 'REFERÊNCIA'], headers_norm)),
                'DATA VENCIMENTO': formatar_data_yyyymmdd(self.get_value(row, ['DATA VENCIMENTO', 'VENCIMENTO'], headers_norm)),
                'VALOR PARCELA': formatar_valor(self.get_value(row, ['INADIMPLENCIA', 'VALOR PARCELA', 'VALOR'], headers_norm)),
                'EMAIL': limpar_email(self.get_value(row, ['EMAIL', 'E-MAIL'], headers_norm))
            }

            if any(v for v in out.values() if v):
                transformed_rows.append(out)

        return transformed_rows
