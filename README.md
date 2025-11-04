# AIX_FIRST_PROJECT  
AI 기반 사출성형 공급망 최적화 프로젝트

---

## 프로젝트 개요
AIX_FIRST_PROJECT는 사출성형 공급망 데이터를 기반으로  
LightGBM, CatBoost, Random Forest 모델을 활용해 수주량을 예측하고  
FastAPI + Chart.js로 시각화하는 AI 예측 시스템입니다.

---

## 폴더 구조
AIX_FIRST_PROJECT/
├── AIX_FIRST_PROJECT/
│ ├── main.py
│ ├── templates/
│ │ ├── intro.html
│ │ └── dashboard.html
│ ├── static/
│ │ ├── css/
│ │ │ ├── common.css
│ │ │ ├── intro.css
│ │ │ └── dashboard.css
│ │ └── js/
│ │ ├── common.js
│ │ ├── intro.js
│ │ ├── dashboard_A.js
│ │ └── dashboard_B.js
│ └── models/
│ ├── common.py
│ ├── train_tab_a_lightgbm_forecast.py
│ ├── train_tab_a_catboost_forecast.py
│ ├── train_tab_b_randomforest_forecast.py
│ └── outputs/
├── data/
│ ├── raw/
│ ├── processed/
│ └── results/
├── performance_result.csv
├── final_results.csv
├── requirements.txt
└── README.md

yaml
코드 복사

---

## 환경 설정

### 1. 아나콘다 설치
공식 사이트에서 다운로드 및 설치  
https://www.anaconda.com/download

### 2. 가상환경 생성
```bash
conda create -n AIX_FIRST_PROJECT_310 python=3.10
3. 가상환경 활성화
bash
코드 복사
conda activate AIX_FIRST_PROJECT_310
4. pip 업데이트
bash
코드 복사
python -m pip install --upgrade pip
5. 의존성 설치
bash
코드 복사
cd AIX_FIRST_PROJECT
pip install -r requirements.txt
실행 방법
bash
코드 복사
cd AIX_FIRST_PROJECT/AIX_FIRST_PROJECT
uvicorn main:app --reload
브라우저에서 접속

cpp
코드 복사
http://127.0.0.1:8000
모델 구성
LightGBM

CatBoost

Random Forest
(앙상블 및 개별 모델 예측 가능)

주요 출력
performance_result.csv

final_results.csv

model_performance_graph.png (시각화용)
