import os
import csv
import shutil
import tempfile
import logging
import zipfile
from typing import List, Optional

import aiofiles
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .utils.text import safe_filename, normalize_header
from .utils.excel import read_input_rows
from .transformers import get_transformer, TRANSFORMERS
from .db import registrar_historico

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("etl-ddm")

app = FastAPI(
    title="ETL Conversor DDM Backend Python Único",
    description="Motor de conversão unificado para todas as instituições do Grupo DDM",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "ok": True,
        "service": "etl-ddm-python-unified",
        "version": "2.0",
        "total_institutions": len(TRANSFORMERS)
    }

@app.get("/institutions")
def list_institutions():
    result = []
    seen = set()
    for key, transformer in TRANSFORMERS.items():
        if transformer.institution_id not in seen:
            seen.add(transformer.institution_id)
            result.append({
                "id": transformer.institution_id,
                "name": transformer.name
            })
    return {"success": True, "data": result}

@app.post("/convert")
@app.post("/etl/convert")
async def convert(
    file: UploadFile = File(...),
    institution: Optional[str] = Query(None),
    institution_form: Optional[str] = Form(None, alias="institution"),
    background_tasks: BackgroundTasks = None,
):
    if background_tasks is None:
        background_tasks = BackgroundTasks()

    selected_institution = institution or institution_form or "bezerra-de-araujo-cba"
    transformer = get_transformer(selected_institution)

    if not transformer:
        raise HTTPException(
            status_code=400,
            detail=f"Instituição '{selected_institution}' não suportada. Opções: {list(TRANSFORMERS.keys())}"
        )

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in (".csv", ".xlsx", ".txt", ".ods"):
        raise HTTPException(status_code=400, detail="Envie um arquivo .csv, .xlsx, .txt ou .ods")

    tmpdir = tempfile.mkdtemp(prefix="etl-ddm-")
    input_path = os.path.join(tmpdir, f"input{ext}")

    try:
        # Salva o arquivo enviado
        async with aiofiles.open(input_path, "wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                await f.write(chunk)

        # Lê os dados
        headers, raw_rows = read_input_rows(input_path, ext)
        if not raw_rows:
            raise HTTPException(status_code=400, detail="O arquivo enviado está vazio ou sem dados válidos.")

        # Executa transformação
        transformed_rows = transformer.transform(raw_rows, headers)
        if not transformed_rows:
            raise HTTPException(status_code=422, detail="Nenhuma linha foi gerada após a transformação.")

        orig_basename = safe_filename(os.path.splitext(file.filename or "planilha")[0])

        # Caso especial: DOCTUM multi-filiais (exporta ZIP)
        if transformer.institution_id.lower() == "doctum":
            zip_path = os.path.join(tmpdir, f"DOCTUM_{orig_basename}.zip")
            out_headers = [k for k in transformed_rows[0].keys() if k != "__FILIAL__"]

            # Agrupa por filial
            filiais_dict = {}
            for r in transformed_rows:
                filial = r.get("__FILIAL__", "Geral") or "Geral"
                row_data = [r[k] for k in out_headers]
                filiais_dict.setdefault(filial, []).append(row_data)

            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for filial_nome, f_rows in filiais_dict.items():
                    csv_name = f"DOCTUM_{safe_filename(filial_nome)}.csv"
                    csv_path = os.path.join(tmpdir, csv_name)
                    with open(csv_path, "w", newline="", encoding="windows-1252", errors="replace") as f:
                        writer = csv.writer(f, delimiter=";", quoting=csv.QUOTE_MINIMAL)
                        writer.writerow(out_headers)
                        for r in f_rows:
                            writer.writerow(r)
                    zipf.write(csv_path, arcname=csv_name)

            registrar_historico(transformer.institution_id, file.filename, f"DOCTUM_{orig_basename}.zip", os.path.getsize(zip_path), "sucesso")
            background_tasks.add_task(shutil.rmtree, tmpdir, ignore_errors=True)

            return FileResponse(
                zip_path,
                media_type="application/zip",
                filename=f"DOCTUM_{orig_basename}.zip",
                background=background_tasks
            )

        # Saída padrão: CSV único com delimitador ; e codificação windows-1252
        out_headers = list(transformed_rows[0].keys())
        out_csv_filename = f"{orig_basename}_{transformer.institution_id.upper()}.csv"
        output_path = os.path.join(tmpdir, "output.csv")

        with open(output_path, "w", newline="", encoding="windows-1252", errors="replace") as csvfile:
            writer = csv.writer(csvfile, delimiter=";", quoting=csv.QUOTE_MINIMAL)
            writer.writerow(out_headers)
            for r in transformed_rows:
                writer.writerow([r[k] for k in out_headers])

        file_size = os.path.getsize(output_path)
        registrar_historico(transformer.institution_id, file.filename, out_csv_filename, file_size, "sucesso")

        background_tasks.add_task(shutil.rmtree, tmpdir, ignore_errors=True)

        return FileResponse(
            output_path,
            media_type="text/csv",
            filename=out_csv_filename,
            background=background_tasks
        )

    except HTTPException:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise
    except Exception as e:
        shutil.rmtree(tmpdir, ignore_errors=True)
        logger.exception("Erro durante conversão no backend Python")
        registrar_historico(transformer.institution_id if transformer else selected_institution, file.filename or "arquivo", "", 0, "erro", str(e))
        raise HTTPException(status_code=500, detail=f"Erro interno no ETL: {str(e)}")
