from .bezerra import BezerraTransformer
from .caduceu import CaduceuTransformer
from .celso_lisboa import CelsoLisboaTransformer
from .factum import FactumTransformer
from .isaac import IsaacTransformer
from .multivix import MultivixTransformer
from .univassouras import UnivassourasTransformer
from .castelo_branco import CasteloBrancoTransformer
from .unicesumar import UnicesumarTransformer
from .doctum import DoctumTransformer

TRANSFORMERS = {
    # Bezerra de Araújo
    "bezerra-de-araujo-cba": BezerraTransformer("cba"),
    "bezerra-de-araujo-faba": BezerraTransformer("faba"),
    "bezerra-de-araujo-pos-siga": BezerraTransformer("pos-siga"),
    "bezerra-de-araujo-pos": BezerraTransformer("pos"),

    # Caduceu
    "caduceu-sistema-1": CaduceuTransformer(1),
    "caduceu-sistema-2": CaduceuTransformer(2),

    # Celso Lisboa
    "celso-lisboa": CelsoLisboaTransformer(),

    # Factum
    "factum": FactumTransformer(),

    # Isaac
    "isaac": IsaacTransformer("isaac"),
    "isaac-negociacao": IsaacTransformer("isaac-negociacao"),
    "isaac-ativos-telefone": IsaacTransformer("isaac-ativos-telefone"),
    "isaac-ativos-negociacao": IsaacTransformer("isaac-ativos-negociacao"),
    "isaac-ativos-2-inativos": IsaacTransformer("isaac-ativos-2-inativos"),
    "isaac-ativos-2-negociacao": IsaacTransformer("isaac-ativos-2-negociacao"),

    # Multivix & Univassouras
    "multivix": MultivixTransformer(),
    "univassouras": UnivassourasTransformer(),

    # Castelo Branco
    "castelo-branco": CasteloBrancoTransformer(),

    # Existentes robustos
    "unicesumar": UnicesumarTransformer(),
    "UNICESUMAR": UnicesumarTransformer(),
    "doctum": DoctumTransformer(),
    "DOCTUM": DoctumTransformer(),
}

def get_transformer(institution_id: str):
    if not institution_id:
        return None
    key = str(institution_id).strip().lower()
    return TRANSFORMERS.get(key) or TRANSFORMERS.get(institution_id.strip())
