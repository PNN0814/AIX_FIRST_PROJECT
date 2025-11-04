"""
파일명 : main.py
설명   : FastAPI 백엔드 (인트로 + 대시보드)
경로   : KAMP/backend/main.py
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
import os

app = FastAPI()

# ---------------------------------
# 경로 설정
# ---------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")

# ✅ A탭 (LightGBM + CatBoost)
OUTPUT_DIR_A = os.path.join(BASE_DIR, "..", "models", "outputs", "tab_a_ensemble_forecast")

# ✅ B탭 (RandomForest / Random Forest)
OUTPUT_DIR_B = os.path.join(BASE_DIR, "..", "models", "outputs", "tab_b_randomforest_forecast")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATE_DIR)

# ---------------------------------
# 기본 라우팅
# ---------------------------------
@app.get("/", response_class=HTMLResponse)
def intro_page(request: Request):
    return templates.TemplateResponse("intro.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

# ---------------------------------
# 📊 A탭 (LightGBM + CatBoost)
# ---------------------------------
@app.get("/api/preprocessing-a")
def get_preprocessing_a_data():
    if not os.path.exists(OUTPUT_DIR_A):
        return JSONResponse({"error": "결과 폴더를 찾을 수 없습니다."}, status_code=404)

    dfs = []
    for file in os.listdir(OUTPUT_DIR_A):
        if not file.endswith(".csv") or file.lower().startswith("ensemble_summary"):
            continue
        path = os.path.join(OUTPUT_DIR_A, file)
        try:
            df = pd.read_csv(path)
            if "Product_Number" not in df.columns:
                continue
            df["Product_Number"] = os.path.splitext(file)[0].replace("_pred", "")
            dfs.append(df)
        except Exception as e:
            print(f"[WARN] {file} 읽기 실패: {e}")
            continue

    if not dfs:
        return JSONResponse({"error": "CSV 파일을 읽을 수 없습니다."}, status_code=404)

    df_all = pd.concat(dfs, ignore_index=True).fillna(0)
    numeric_cols = ["Pred_Value", "MAE", "SMAPE", "Accuracy"]
    for col in numeric_cols:
        if col in df_all.columns:
            df_all[col] = pd.to_numeric(df_all[col], errors="coerce").fillna(0)

    df_all = df_all.sort_values(by="Product_Number").reset_index(drop=True)
    return JSONResponse(content=df_all.to_dict(orient="records"))

# ---------------------------------
# 📊 B탭 (Random Forest)
# ---------------------------------
@app.get("/api/randomforest-results")
def get_randomforest_results():
    """final_results.csv - 날짜별 예측값"""
    path = os.path.join(OUTPUT_DIR_B, "final_results.csv")
    if not os.path.exists(path):
        return JSONResponse({"error": "final_results.csv 없음"}, status_code=404)
    df = pd.read_csv(path).fillna(0)
    return JSONResponse(content=df.to_dict(orient="records"))


@app.get("/api/randomforest-metrics")
def get_randomforest_metrics():
    """performance_result.csv - 모델 지표 (MAE, SMAPE 등)"""
    path = os.path.join(OUTPUT_DIR_B, "performance_result.csv")
    if not os.path.exists(path):
        return JSONResponse({"error": "performance_result.csv 없음"}, status_code=404)
    df = pd.read_csv(path).fillna(0)
    return JSONResponse(content=df.to_dict(orient="records"))