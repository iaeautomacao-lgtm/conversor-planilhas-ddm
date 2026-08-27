from .base import BaseTransformer
from ..utils.text import normalize_header, clean_text
from ..utils.formatters import (
    formatar_cpf, formatar_cep, formatar_telefones_multiplos, 
    formatar_data_yyyymmdd, formatar_valor, limpar_email
)

class IsaacTransformer(BaseTransformer):
    def __init__(self, variant: str = "isaac"):
        names = {
            "isaac": "ISAAC",
            "isaac-negociacao": "ISAAC - NEGOCIAÇÃO",
            "isaac-ativos-telefone": "ISAAC ATIVOS - ativos_telefone",
            "isaac-ativos-negociacao": "ISAAC ATIVOS - NEGOCIAÇÃO",
            "isaac-ativos-2-inativos": "ISAAC ATIVOS 2 - ativos_inativos",
            "isaac-ativos-2-negociacao": "ISAAC ATIVOS 2 - NEGOCIAÇÃO"
        }
        super().__init__(variant, names.get(variant, "ISAAC"))
        self.variant = variant

    def transform(self, raw_rows: list, headers: list) -> list:
        headers_norm = [normalize_header(h) for h in headers]
        transformed_rows = []

        for row in raw_rows:
            cpf = formatar_cpf(self.get_value(row, ['CPF', 'CPF ALUNO'], headers_norm))
            nome_aluno = clean_text(self.get_value(row, ['NOME ALUNO', 'NOME_ALUNO', 'ALUNO'], headers_norm))
            nome_escola = clean_text(self.get_value(row, ['NOME ESCOLA', 'NOME_ESCOLA', 'ESCOLA'], headers_norm))
            
            tel_raw = self.get_value(row, ['TELEFONE', 'CELULAR', 'FONE'], headers_norm)
            tels = formatar_telefones_multiplos(tel_raw)

            data_rec = formatar_data_yyyymmdd(self.get_value(row, ['DATA RECEBIVEL RECENTE', 'DATA_RECEBIVEL_VENCIDO_MAIS_RECENTE', 'VENCIMENTO'], headers_norm))
            valor_devido = formatar_valor(self.get_value(row, ['VALOR DEVIDO', 'VALOR_DEVIDO', 'VALOR'], headers_norm))
            email = limpar_email(self.get_value(row, ['EMAIL', 'E-MAIL'], headers_norm))

            out = {
                'CPF (A)': cpf,
                'NOME ALUNO (B)': nome_aluno,
                'NOME ESCOLA (C)': nome_escola,
                'CPF (D)': cpf,
                'VAZIA (E)': '',
                'VAZIA (F)': '',
                'VAZIA (G)': '',
                'VAZIA (H)': '',
                'VAZIA (I)': '',
                'VAZIA (J)': '',
                'TELEFONE (K)': tels["tel1"],
                'VAZIA (L)': '',
                'VAZIA (M)': '',
                'MENSALIDADE (N)': '',
                'DATA RECEBIVEL RECENTE (O)': data_rec,
                'VALOR DEVIDO (P)': valor_devido,
                'EMAIL (Q)': email
            }

            if any(v for v in out.values() if v):
                transformed_rows.append(out)

        return transformed_rows
