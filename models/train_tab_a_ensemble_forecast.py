"""
파일명 : train_tab_a_ensemble_forecast.py
설명   : LightGBM + CatBoost 예측 결과를 결합한 3일치 가중 앙상블 생성 스크립트
         - 두 모델의 예측 결과를 가중 평균 (LightGBM: 0.6 / CatBoost: 0.4)으로 병합
         - 제품별 3일치 예측값과 MAE·SMAPE·Accuracy 평균 계산
         - 개별 제품 예측 CSV와 전체 요약 CSV·JSON 파일 출력
환경   : Python 3.10 / pandas==2.0.3 / numpy==1.23.5
실행법 :
    cd ~/
    python -m models.train_tab_a_ensemble_forecast
"""

import os, json
import pandas as pd
import numpy as np
from models.common import OUTPUT_DIR

# ---------------------------------
# 경로 설정
# ---------------------------------
LGBM_DIR = os.path.join(OUTPUT_DIR, "tab_a_lightgbm_forecast")
CATB_DIR = os.path.join(OUTPUT_DIR, "tab_a_catboost_forecast")
ENS_DIR = os.path.join(OUTPUT_DIR, "tab_a_ensemble_forecast")
os.makedirs(ENS_DIR, exist_ok=True)

# 가중치 설정 (LightGBM 0.6, CatBoost 0.4)
W_LGBM, W_CATB = 0.6, 0.4

# LightGBM 예측 파일 목록 수집
lgbm_files = [f for f in os.listdir(LGBM_DIR) if f.endswith("_pred.csv")]
records = []

# ---------------------------------
# 파일별 예측 병합 및 성능 요약 계산
# ---------------------------------
for f in lgbm_files:
    product = f.replace("_pred.csv", "")
    lgbm_path = os.path.join(LGBM_DIR, f)
    catb_path = os.path.join(CATB_DIR, f)
    if not os.path.exists(catb_path):
        continue

    # 두 모델의 예측 결과 로드
    lgbm_df = pd.read_csv(lgbm_path)
    catb_df = pd.read_csv(catb_path)

    # 예측값 가중 평균
    ensemble_pred = (lgbm_df["Pred_Value"] * W_LGBM + catb_df["Pred_Value"] * W_CATB).round().astype(int)

    # 지표 평균 계산 (MAE, SMAPE, Accuracy)
    mae = np.mean([lgbm_df["MAE"].iloc[0], catb_df["MAE"].iloc[0]])
    smape = np.mean([lgbm_df["SMAPE"].iloc[0], catb_df["SMAPE"].iloc[0]])
    acc = np.mean([lgbm_df["Accuracy"].iloc[0], catb_df["Accuracy"].iloc[0]])

    # 제품별 결과 저장용 DataFrame 생성
    result = pd.DataFrame({
        "Date": lgbm_df["Date"],
        "Product_Number": lgbm_df["Product_Number"],
        "Pred_Value": ensemble_pred,
        "MAE": [round(mae, 2)] * len(lgbm_df),
        "SMAPE": [round(smape, 2)] * len(lgbm_df),
        "Accuracy": [round(acc, 2)] * len(lgbm_df)
    })

    # 개별 예측 결과 CSV 저장
    result.to_csv(os.path.join(ENS_DIR, f"{product}_pred.csv"), index=False, encoding="utf-8-sig")

    # 요약용 리스트에 성능 저장
    records.append({
        "Product_Number": product,
        "MAE": round(mae, 2),
        "SMAPE": round(smape, 2),
        "Accuracy": round(acc, 2)
    })

# ---------------------------------
# 전체 요약 CSV 및 JSON 저장
# ---------------------------------
df_summary = pd.DataFrame(records)
df_summary.to_csv(os.path.join(ENS_DIR, "ensemble_summary.csv"), index=False, encoding="utf-8-sig")
with open(os.path.join(ENS_DIR, "ensemble_summary.json"), "w", encoding="utf-8") as jf:
    json.dump(records, jf, ensure_ascii=False, indent=4)

print("3일치 날짜별 예측 앙상블 CSV 생성 완료.")