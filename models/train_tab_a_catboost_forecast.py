"""
파일명 : train_tab_a_catboost_forecast.py
설명   : CatBoost 기반 Product_Number별 3일치 수주량 예측
         - Python 3.10 / catboost==1.2.3
         - 예측값 int 변환 (날짜별 1행씩)
         - MAE / SMAPE / Accuracy 포함 CSV 저장
실행법 :
    cd ~/KAMP
    python -m models.train_tab_a_catboost_forecast
"""

import os, json
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from datetime import timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error
from models.common import OUTPUT_DIR, DATA_RESULT_DIR

DATA_PATH = os.path.join(DATA_RESULT_DIR, "04_전처리_불필요컬럼_제거.csv")
OUTPUT_SUBDIR = os.path.join(OUTPUT_DIR, "tab_a_catboost_forecast")
os.makedirs(OUTPUT_SUBDIR, exist_ok=True)

TARGET_COL = "T일 예정 수주량"
PRED_DAYS = 3

df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
df["Date"] = pd.to_datetime(df["Date"])
product_list = df["Product_Number"].unique()
print(f"CatBoost 학습 시작 (총 {len(product_list)}개 Product)")

records = []
for product in product_list:
    d = df[df["Product_Number"] == product].sort_values("Date").reset_index(drop=True)
    if len(d) < 90:
        continue

    recent_df = d.tail(90).reset_index(drop=True)
    scaler_x, scaler_y = MinMaxScaler(), MinMaxScaler()
    X = scaler_x.fit_transform(recent_df[["T일 예정 수주량"]])
    y = scaler_y.fit_transform(recent_df[[TARGET_COL]]).flatten()

    X_train, y_train = X[:-PRED_DAYS], y[:-PRED_DAYS]
    X_test, y_test = X[-PRED_DAYS:], y[-PRED_DAYS:]

    model = CatBoostRegressor(
        iterations=300, learning_rate=0.05, depth=8,
        loss_function="MAE", random_seed=42, verbose=False
    )
    model.fit(X_train, y_train)

    pred_scaled = model.predict(X_test)
    pred = scaler_y.inverse_transform(pred_scaled.reshape(-1, 1)).flatten()
    pred = np.round(pred).astype(int)

    actual = scaler_y.inverse_transform(y_test.reshape(-1, 1)).flatten()
    mae = mean_absolute_error(actual, pred)
    smape = np.mean(200 * np.abs(actual - pred) / (np.abs(actual) + np.abs(pred) + 1e-5))
    acc = 100 - (mae / (np.mean(actual) + 1e-5) * 100)
    acc = max(0, min(acc, 100))

    base_date = recent_df["Date"].iloc[-1]
    future_dates = [base_date + timedelta(days=i) for i in range(1, PRED_DAYS + 1)]

    result = pd.DataFrame({
        "Date": future_dates,
        "Product_Number": [product] * PRED_DAYS,
        "Pred_Value": pred[:PRED_DAYS],
        "MAE": [round(mae, 2)] * PRED_DAYS,
        "SMAPE": [round(smape, 2)] * PRED_DAYS,
        "Accuracy": [round(acc, 2)] * PRED_DAYS
    })
    result.to_csv(os.path.join(OUTPUT_SUBDIR, f"{product}_pred.csv"), index=False, encoding="utf-8-sig")

    records.append({"Product_Number": product, "MAE": mae, "SMAPE": smape, "Accuracy": acc})

df_result = pd.DataFrame(records)
df_result.to_csv(os.path.join(OUTPUT_SUBDIR, "accuracy_score.csv"), index=False, encoding="utf-8-sig")
print("CatBoost 예측 완료 및 CSV 저장.")