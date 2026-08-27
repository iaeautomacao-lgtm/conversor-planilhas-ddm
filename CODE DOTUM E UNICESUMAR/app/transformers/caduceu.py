from .base import BaseTransformer
from ..utils.text import normalize_header, clean_text
from ..utils.formatters import (
    formatar_cpf, formatar_cep, formatar_telefones_multiplos, 
    formatar_data_yyyymmdd, formatar_valor, formatar_endereco, limpar_email
)

class CaduceuTransformer(BaseTransformer):
    def __init__(self, sistema: int = 1):
        inst_id = f"caduceu-sistema-{sistema}"
        name = f"CADUCEU SISTEMA {sistema}"
        super().__init__(inst_id, name)
        self.sistema = sistema

    def transform(self, raw_rows: list, headers: list) -> list:
        headers_norm = [normalize_header(h) for h in headers]
        transformed_rows = []

        for row in raw_rows:
            tel_raw = self.get_value(row, ["TELEFONE", "CELULAR", "FONE"], headers_norm)
            tels = formatar_telefones_multiplos(tel_raw)

            out = {
                'MATRÍCULA/RA': clean_text(self.get_value(row, ['MATRÍCULA/RA', 'MATRICULA', 'RA'], headers_norm)),
                'NOME DO DEVEDOR/ALUNO': clean_text(self.get_value(row, ['NOME DO DEVEDOR/ALUNO', 'NOME', 'ALUNO'], headers_norm)),
                'CURSO': clean_text(self.get_value(row, ['CURSO', 'NOME CURSO'], headers_norm)),
                'CPF DO DEVEDOR/ALUNO': formatar_cpf(self.get_value(row, ['CPF DO DEVEDOR/ALUNO', 'CPF'], headers_norm)),
                'DATA NASCIMENTO DEVEDOR/RESP FINANCEIRO': formatar_data_yyyymmdd(self.get_value(row, ['DATA NASCIMENTO DEVEDOR/RESP FINANCEIRO', 'NASC', 'DATA NASCIMENTO'], headers_norm)),
                'ENDEREÇO DEVEDOR': formatar_endereco(self.get_value(row, ['ENDEREÇO DEVEDOR', 'ENDERECO', 'ENDEREÇO'], headers_norm)),
                'BAIRRO': clean_text(self.get_value(row, ['BAIRRO'], headers_norm)),
                'CIDADE': clean_text(self.get_value(row, ['CIDADE'], headers_norm)),
                'CEP': formatar_cep(self.get_value(row, ['CEP'], headers_norm)),
                'ESTADO': clean_text(self.get_value(row, ['ESTADO', 'UF'], headers_norm)),
                'TELEFONE': tels["tel1"],
                'CELULAR': tels["tel2"],
                'RESPONSÁVEL FINANCEIRO': clean_text(self.get_value(row, ['RESPONSÁVEL FINANCEIRO', 'RESPONSAVEL'], headers_norm)),
                'REFERÊNCIA/ID': clean_text(self.get_value(row, ['REFERÊNCIA/ID', 'REFERENCIA', 'ID'], headers_norm)),
                'DATA PARCELA': formatar_data_yyyymmdd(self.get_value(row, ['DATA PARCELA', 'DATA VENCIMENTO', 'VENCIMENTO'], headers_norm)),
                'VALOR PARCELA': formatar_valor(self.get_value(row, ['VALOR PARCELA', 'VALOR'], headers_norm)),
                'EMAIL': limpar_email(self.get_value(row, ['EMAIL', 'E-MAIL'], headers_norm))
            }

            if any(v for v in out.values() if v):
                transformed_rows.append(out)

        return transformed_rows
