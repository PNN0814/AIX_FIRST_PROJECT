"""
파일명 : train_tab_a_ensemble_forecast.py
설명   : LightGBM + CatBoost 기반 3일치 예측 가중 앙상블
         - 날짜별 예측 결과 병합 (0.6 : 0.4)
         - MAE / SMAPE / Accuracy 계산
         - 웹 사용 가능 CSV/JSON 출력
실행법 :
    cd ~/KAMP
    python -m models.train_tab_a_ensemble_forecast
"""

import os, json
import pandas as pd
import numpy as np
from models.common import OUTPUT_DIR

LGBM_DIR = os.path.join(OUTPUT_DIR, "tab_a_lightgbm_forecast")
CATB_DIR = os.path.join(OUTPUT_DIR, "tab_a_catboost_forecast")
ENS_DIR = os.path.join(OUTPUT_DIR, "tab_a_ensemble_forecast")
os.makedirs(ENS_DIR, exist_ok=True)

W_LGBM, W_CATB = 0.6, 0.4

lgbm_files = [f for f in os.listdir(LGBM_DIR) if f.endswith("_pred.csv")]
records = []

for f in lgbm_files:
    product = f.replace("_pred.csv", "")
    lgbm_path = os.path.join(LGBM_DIR, f)
    catb_path = os.path.join(CATB_DIR, f)
    if not os.path.exists(catb_path):
        continue

    lgbm_df = pd.read_csv(lgbm_path)
    catb_df = pd.read_csv(catb_path)
    ensemble_pred = (lgbm_df["Pred_Value"] * W_LGBM + catb_df["Pred_Value"] * W_CATB).round().astype(int)

    mae = np.mean([lgbm_df["MAE"].iloc[0], catb_df["MAE"].iloc[0]])
    smape = np.mean([lgbm_df["SMAPE"].iloc[0], catb_df["SMAPE"].iloc[0]])
    acc = np.mean([lgbm_df["Accuracy"].iloc[0], catb_df["Accuracy"].iloc[0]])

    result = pd.DataFrame({
        "Date": lgbm_df["Date"],
        "Product_Number": lgbm_df["Product_Number"],
        "Pred_Value": ensemble_pred,
        "MAE": [round(mae, 2)] * len(lgbm_df),
        "SMAPE": [round(smape, 2)] * len(lgbm_df),
        "Accuracy": [round(acc, 2)] * len(lgbm_df)
    })
    result.to_csv(os.path.join(ENS_DIR, f"{product}_pred.csv"), index=False, encoding="utf-8-sig")

    records.append({
        "Product_Number": product,
        "MAE": round(mae, 2),
        "SMAPE": round(smape, 2),
        "Accuracy": round(acc, 2)
    })

df_summary = pd.DataFrame(records)
df_summary.to_csv(os.path.join(ENS_DIR, "ensemble_summary.csv"), index=False, encoding="utf-8-sig")
with open(os.path.join(ENS_DIR, "ensemble_summary.json"), "w", encoding="utf-8") as jf:
    json.dump(records, jf, ensure_ascii=False, indent=4)

print("3일치 날짜별 예측 앙상블 CSV 생성 완료.")