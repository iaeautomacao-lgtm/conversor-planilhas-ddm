import re
from datetime import datetime

def formatar_cpf(valor) -> str:
    if not valor:
        return '="00000000000"'
    num = re.sub(r'\D', '', str(valor)).strip()
    cpf_formatado = num.zfill(11)[-11:]
    return f'="{cpf_formatado}"'

def formatar_cep(valor) -> str:
    if not valor:
        return ""
    num = re.sub(r'\D', '', str(valor)).strip()
    return num.zfill(8)[:8]

def formatar_telefone(valor) -> str:
    if not valor:
        return ''
    telefone = str(valor).strip()
    try:
        telefone = str(int(float(telefone)))
    except Exception:
        telefone = re.sub(r'\D', '', telefone)
    return f'="{telefone.zfill(11)}"'

def formatar_telefones_multiplos(valor):
    if not valor:
        return {"tel1": "", "tel2": ""}
    partes = re.split(r'[\\/|,;]', str(valor))
    nums = [re.sub(r'\D', '', p).strip() for p in partes if len(re.sub(r'\D', '', p).strip()) >= 8]
    return {
        "tel1": nums[0] if len(nums) > 0 else "",
        "tel2": nums[1] if len(nums) > 1 else ""
    }

def formatar_data_yyyymmdd(data) -> str:
    if not data:
        return ""
    s = str(data).strip()

    if re.fullmatch(r"\d{8}", s):
        return s

    if re.fullmatch(r"\d{1,2}/\d{1,2}/\d{4}", s):
        d, m, a = s.split("/")
        return f"{a}{m.zfill(2)}{d.zfill(2)}"

    limpo = re.sub(r"\D", "", s)
    if len(limpo) == 8:
        try:
            ano = int(limpo[:4])
            if 1900 <= ano <= 2100:
                return limpo
        except Exception:
            pass
        return f"{limpo[4:8]}{limpo[2:4]}{limpo[0:2]}"

    try:
        d = datetime.fromisoformat(s)
        return f"{d.year}{str(d.month).zfill(2)}{str(d.day).zfill(2)}"
    except Exception:
        return ""

def formatar_valor(valor) -> str:
    if valor is None or str(valor).strip() == "":
        return '="0,00"'
    s = str(valor).strip()
    s = re.sub(r"[^\d,\.-]", "", s)
    if "," in s and "." in s:
        s = s.replace(".", "")
    s = s.replace(",", ".")
    try:
        num = float(s)
    except Exception:
        return '="0,00"'
    val_str = f"{num:.2f}".replace(".", ",")
    return f'="{val_str}"'

def formatar_endereco(valor) -> str:
    if not valor:
        return ""
    return re.sub(r'[.,;:]', '', str(valor)).strip()

def limpar_email(email) -> str:
    if not email:
        return ""
    return str(email).replace('"', '').replace("'", '').strip()

def formatar_referencia(valor) -> str:
    if valor is None or str(valor).strip() == "":
        return '=""'
    s = re.sub(r"\D", "", str(valor))
    return f'="{s}"'
