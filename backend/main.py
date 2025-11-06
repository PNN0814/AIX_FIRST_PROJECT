from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
import os

# FastAPI 인스턴스 생성
app = FastAPI()

# ---------------------------------
# 경로 설정
# ---------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # 현재 파일 기준 경로
STATIC_DIR = os.path.join(BASE_DIR, "static")          # 정적 파일(css, js) 경로
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")     # HTML 템플릿 경로

# A탭 (LightGBM + CatBoost) 결과 폴더
OUTPUT_DIR_A = os.path.join(BASE_DIR, "..", "models", "outputs", "tab_a_ensemble_forecast")

# B탭 (RandomForest) 결과 폴더
OUTPUT_DIR_B = os.path.join(BASE_DIR, "..", "models", "outputs", "tab_b_randomforest_forecast")

# ---------------------------------
# FastAPI 설정
# ---------------------------------
# 정적 파일 및 템플릿 등록
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATE_DIR)

# ---------------------------------
# 기본 페이지 라우팅
# ---------------------------------
@app.get("/", response_class=HTMLResponse)
def intro_page(request: Request):
    """인트로 페이지 (intro.html)"""
    return templates.TemplateResponse("intro.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard_page(request: Request):
    """대시보드 페이지 (dashboard.html)"""
    return templates.TemplateResponse("dashboard.html", {"request": request})

# ---------------------------------
# A탭 API (LightGBM + CatBoost 예측 결과)
# ---------------------------------
@app.get("/api/preprocessing-a")
def get_preprocessing_a_data():
    """A탭 예측 결과 CSV 파일들을 읽어 통합 후 반환"""
    if not os.path.exists(OUTPUT_DIR_A):
        return JSONResponse({"error": "결과 폴더를 찾을 수 없습니다."}, status_code=404)

    dfs = []
    for file in os.listdir(OUTPUT_DIR_A):
        # ensemble_summary 등 요약 파일 제외
        if not file.endswith(".csv") or file.lower().startswith("ensemble_summary"):
            continue
        path = os.path.join(OUTPUT_DIR_A, file)
        try:
            df = pd.read_csv(path)
            # Product_Number 컬럼이 없으면 무시
            if "Product_Number" not in df.columns:
                continue
            # 파일명 기준으로 제품명 지정
            df["Product_Number"] = os.path.splitext(file)[0].replace("_pred", "")
            dfs.append(df)
        except Exception as e:
            print(f"[WARN] {file} 읽기 실패: {e}")
            continue

    if not dfs:
        return JSONResponse({"error": "CSV 파일을 읽을 수 없습니다."}, status_code=404)

    # 모든 CSV 병합 및 결측값 처리
    df_all = pd.concat(dfs, ignore_index=True).fillna(0)

    # 숫자형 컬럼 변환
    numeric_cols = ["Pred_Value", "MAE", "SMAPE", "Accuracy"]
    for col in numeric_cols:
        if col in df_all.columns:
            df_all[col] = pd.to_numeric(df_all[col], errors="coerce").fillna(0)

    # 제품명 기준 정렬 후 JSON 변환
    df_all = df_all.sort_values(by="Product_Number").reset_index(drop=True)
    return JSONResponse(content=df_all.to_dict(orient="records"))

# ---------------------------------
# B탭 API (Random Forest 결과)
# ---------------------------------
@app.get("/api/randomforest-results")
def get_randomforest_results():
    """B탭 - 날짜별 예측 결과 (final_results.csv)"""
    path = os.path.join(OUTPUT_DIR_B, "final_results.csv")
    if not os.path.exists(path):
        return JSONResponse({"error": "final_results.csv 없음"}, status_code=404)
    df = pd.read_csv(path).fillna(0)
    return JSONResponse(content=df.to_dict(orient="records"))

@app.get("/api/randomforest-metrics")
def get_randomforest_metrics():
    """B탭 - 모델 성능 지표 (performance_result.csv)"""
    path = os.path.join(OUTPUT_DIR_B, "performance_result.csv")
    if not os.path.exists(path):
        return JSONResponse({"error": "performance_result.csv 없음"}, status_code=404)
    df = pd.read_csv(path).fillna(0)
    return JSONResponse(content=df.to_dict(orient="records"))