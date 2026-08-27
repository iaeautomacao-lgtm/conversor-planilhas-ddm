# ETL

Serviço ETL desenvolvido em FastAPI para conversão e padronização
de arquivos XLSX e CSV

## Endpoints

- POST /etl/upload
- GET /etl/status/{job_id}
- GET /etl/download/{job_id}

## Ambiente de Produção (Render)

O serviço está publicado no Render e pode ser acessado em:

- API base
https://etl-ddm.onrender.com/

- Documentação interativa (Swagger / OpenAPI)
https://etl-ddm.onrender.com/docs#/


## Execução local

```bash
uvicorn app.main:app --reload


