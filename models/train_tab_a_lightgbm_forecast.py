"""
파일명 : train_tab_a_lightgbm_forecast.py
설명   : LightGBM 기반 Product_Number별 3일치 수주량 예측 모델
         - 최근 90일 데이터를 학습해 T+1~T+3일 예측 수행
         - MinMaxScaler로 입력·타깃 정규화 후 LightGBM 회귀모델 훈련
         - 예측값 역변환 및 MAE·SMAPE·Accuracy 계산
         - 제품별 예측 결과 CSV와 전체 성능 요약 CSV 저장
환경   : Python 3.10 / lightgbm==3.3.5 / scikit-learn==1.3.0 / pandas==2.0.3
실행법 :
    cd ~/
    python -m models.train_tab_a_lightgbm_forecast
"""

import os, json
import numpy as np
import pandas as pd
import lightgbm as lgb
from datetime import timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error
from models.common import OUTPUT_DIR, DATA_RESULT_DIR

# ---------------------------------
# 경로 및 설정
# ---------------------------------
DATA_PATH = os.path.join(DATA_RESULT_DIR, "04_전처리_불필요컬럼_제거.csv")  # 입력 데이터
OUTPUT_SUBDIR = os.path.join(OUTPUT_DIR, "tab_a_lightgbm_forecast")          # 출력 폴더
os.makedirs(OUTPUT_SUBDIR, exist_ok=True)

TARGET_COL = "T일 예정 수주량"  # 예측 대상 컬럼
PRED_DAYS = 3                   # 예측 일수

# ---------------------------------
# 데이터 로드
# ---------------------------------
df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
df["Date"] = pd.to_datetime(df["Date"])
product_list = df["Product_Number"].unique()
print(f"LightGBM 학습 시작 (총 {len(product_list)}개 Product)")

records = []

# ---------------------------------
# 제품별 모델 학습 및 예측
# ---------------------------------
for product in product_list:
    d = df[df["Product_Number"] == product].sort_values("Date").reset_index(drop=True)
    if len(d) < 90:  # 학습 데이터 부족 시 스킵
        continue

    # 최근 90일 데이터 사용
    recent_df = d.tail(90).reset_index(drop=True)
    scaler_x, scaler_y = MinMaxScaler(), MinMaxScaler()

    # 스케일링 적용
    X = scaler_x.fit_transform(recent_df[["T일 예정 수주량"]])
    y = scaler_y.fit_transform(recent_df[[TARGET_COL]]).flatten()

    # 학습/테스트 데이터 분리
    X_train, y_train = X[:-PRED_DAYS], y[:-PRED_DAYS]
    X_test, y_test = X[-PRED_DAYS:], y[-PRED_DAYS:]

    # LightGBM 회귀모델 학습
    model = lgb.LGBMRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=8,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
    model.fit(X_train, y_train)

    # 예측 및 역변환
    pred_scaled = model.predict(X_test)
    pred = scaler_y.inverse_transform(pred_scaled.reshape(-1, 1)).flatten()
    pred = np.round(pred).astype(int)

    # 실제값 변환 및 지표 계산
    actual = scaler_y.inverse_transform(y_test.reshape(-1, 1)).flatten()
    mae = mean_absolute_error(actual, pred)
    smape = np.mean(200 * np.abs(actual - pred) / (np.abs(actual) + np.abs(pred) + 1e-5))
    acc = 100 - (mae / (np.mean(actual) + 1e-5) * 100)
    acc = max(0, min(acc, 100))  # 음수 또는 100 초과 방지

    # 미래 예측 날짜 생성 (T+1~T+3)
    base_date = recent_df["Date"].iloc[-1]
    future_dates = [base_date + timedelta(days=i) for i in range(1, PRED_DAYS + 1)]

    # 결과 저장
    result = pd.DataFrame({
        "Date": future_dates,
        "Product_Number": [product] * PRED_DAYS,
        "Pred_Value": pred[:PRED_DAYS],
        "MAE": [round(mae, 2)] * PRED_DAYS,
        "SMAPE": [round(smape, 2)] * PRED_DAYS,
        "Accuracy": [round(acc, 2)] * PRED_DAYS
    })
    result.to_csv(os.path.join(OUTPUT_SUBDIR, f"{product}_pred.csv"), index=False, encoding="utf-8-sig")

    # 요약용 기록
    records.append({"Product_Number": product, "MAE": mae, "SMAPE": smape, "Accuracy": acc})

# ---------------------------------
# 전체 요약 CSV 저장
# ---------------------------------
df_result = pd.DataFrame(records)
df_result.to_csv(os.path.join(OUTPUT_SUBDIR, "accuracy_score.csv"), index=False, encoding="utf-8-sig")
print("LightGBM 예측 완료 및 CSV 저장.")