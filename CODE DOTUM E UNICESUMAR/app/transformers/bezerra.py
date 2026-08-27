from .base import BaseTransformer
from ..utils.text import normalize_header, clean_text
from ..utils.formatters import (
    formatar_cpf, formatar_cep, formatar_telefones_multiplos, 
    formatar_data_yyyymmdd, formatar_valor, formatar_endereco, limpar_email
)

class BezerraTransformer(BaseTransformer):
    def __init__(self, variant: str = "cba"):
        names = {
            "cba": "BEZERRA DE ARAUJO - CBA",
            "faba": "BEZERRA DE ARAUJO - FABA",
            "pos-siga": "BEZERRA DE ARAUJO - POS SIGA",
            "pos": "BEZERRA DE ARAUJO - POS",
        }
        inst_id = f"bezerra-de-araujo-{variant}"
        super().__init__(inst_id, names.get(variant, "BEZERRA DE ARAUJO"))
        self.variant = variant

    def transform(self, raw_rows: list, headers: list) -> list:
        headers_norm = [normalize_header(h) for h in headers]
        transformed_rows = []

        for row in raw_rows:
            tel_raw = self.get_value(row, ["TELEFONE", "CELULAR", "FONE"], headers_norm)
            tels = formatar_telefones_multiplos(tel_raw)

            cpf_aluno = formatar_cpf(self.get_value(row, ["CPF", "CPF ALUNO"], headers_norm))
            cpf_resp = formatar_cpf(self.get_value(row, ["CPF RESPONSAVEL", "CPF RESP"], headers_norm))

            out = {
                'MATRÍCULA': clean_text(self.get_value(row, ['MATRÍCULA', 'MATRICULA', 'RA'], headers_norm)),
                'NOME': clean_text(self.get_value(row, ['NOME', 'ALUNO', 'NOME ALUNO'], headers_norm)),
                'CURSO': clean_text(self.get_value(row, ['CURSO', 'NOME CURSO'], headers_norm)),
                'CPF': cpf_aluno,
                'NASC': formatar_data_yyyymmdd(self.get_value(row, ['NASC', 'DATA NASCIMENTO', 'NASCIMENTO'], headers_norm)),
                'ENDERECO': formatar_endereco(self.get_value(row, ['ENDERECO', 'ENDEREÇO'], headers_norm)),
                'BAIRRO': clean_text(self.get_value(row, ['BAIRRO'], headers_norm)),
                'CIDADE': clean_text(self.get_value(row, ['CIDADE'], headers_norm)),
                'CEP': formatar_cep(self.get_value(row, ['CEP'], headers_norm)),
                'ESTADO': clean_text(self.get_value(row, ['ESTADO', 'UF'], headers_norm)),
                'TELEFONE': tels["tel1"],
                'CELULAR': tels["tel2"],
                'REFERENCIA': clean_text(self.get_value(row, ['REFERENCIA', 'REFERÊNCIA', 'ID'], headers_norm)),
                'DATA PARCELA': formatar_data_yyyymmdd(self.get_value(row, ['DATA PARCELA', 'VENCIMENTO', 'DATA VENCIMENTO'], headers_norm)),
                'VALOR PARCEL': formatar_valor(self.get_value(row, ['VALOR PARCEL', 'VALOR PARCELA', 'VALOR'], headers_norm)),
                'RESPONSAVEL': clean_text(self.get_value(row, ['RESPONSAVEL', 'RESPONSÁVEL'], headers_norm)),
                'CPF RESPONSAVEL': cpf_resp,
                'RESPONSAVEL NASCIMENTO': formatar_data_yyyymmdd(self.get_value(row, ['NASC', 'RESPONSAVEL NASCIMENTO'], headers_norm)),
                'RESPONSAVEL ENDERECO': formatar_endereco(self.get_value(row, ['ENDERECO', 'ENDEREÇO'], headers_norm)),
                'RESPONSAVEL BAIRRO': clean_text(self.get_value(row, ['BAIRRO'], headers_norm)),
                'RESPONSAVEL CIDADE': clean_text(self.get_value(row, ['CIDADE'], headers_norm)),
                'RESPONSAVEL CEP': formatar_cep(self.get_value(row, ['CEP'], headers_norm)),
                'RESPONSAVEL ESTADO': clean_text(self.get_value(row, ['ESTADO'], headers_norm)),
                'RESPONSAVEL TELEFONE': tels["tel1"],
                'RESPONSAVEL CELULAR': tels["tel2"],
                'RESPONSAVEL EMAIL': limpar_email(self.get_value(row, ['E-MAIL', 'EMAIL'], headers_norm)),
                'DADOS ESPECIFICOS CLIENT': formatar_valor(self.get_value(row, ['VALOR'], headers_norm)),
                'VALOR PARCELA2 (BOLSA)': formatar_valor(self.get_value(row, ['VALOR'], headers_norm))
            }

            if any(v for v in out.values() if v):
                transformed_rows.append(out)

        return transformed_rows
