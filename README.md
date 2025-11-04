AIX_FIRST_PROJECT
AI 기반 사출성형 공급망 최적화 시스템
프로젝트 소개
사출성형 산업의 공급망 데이터를 분석하여 수주량을 예측하는 머신러닝 시스템입니다.
LightGBM, CatBoost, Random Forest 모델을 활용하며, FastAPI 기반 웹 대시보드로 예측 결과를 시각화합니다.
환경 설정
Anaconda 설치
https://www.anaconda.com/download 에서 설치
가상환경 생성 및 활성화
bashconda create -n AIX_FIRST_PROJECT_310 python=3.10
conda activate AIX_FIRST_PROJECT_310
python -m pip install --upgrade pip
패키지 설치
bashcd AIX_FIRST_PROJECT
pip install -r requirements.txt
실행 방법
bashcd AIX_FIRST_PROJECT/AIX_FIRST_PROJECT
uvicorn main:app --reload
브라우저에서 http://127.0.0.1:8000 접속
프로젝트 구조
AIX_FIRST_PROJECT/
├── AIX_FIRST_PROJECT/
│   ├── main.py                 # FastAPI 서버 진입점
│   ├── templates/              # HTML 템플릿
│   │   ├── intro.html
│   │   └── dashboard.html
│   ├── static/                 # CSS, JavaScript 파일
│   │   ├── css/
│   │   └── js/
│   └── models/                 # ML 모델 학습 및 예측 코드
│       ├── common.py
│       ├── train_tab_a_lightgbm_forecast.py
│       ├── train_tab_a_catboost_forecast.py
│       ├── train_tab_b_randomforest_forecast.py
│       └── outputs/            # 학습된 모델 저장
├── data/
│   ├── raw/                    # 원본 데이터
│   ├── processed/              # 전처리된 데이터
│   └── results/                # 예측 결과
├── performance_result.csv      # 모델 성능 지표
├── final_results.csv          # 최종 예측 결과
├── requirements.txt
└── README.md
주요 파일 설명

main.py: FastAPI 웹 서버 및 API 엔드포인트
models/: 각 머신러닝 모델의 학습 및 예측 스크립트
templates/: 웹 인터페이스 HTML
static/: CSS 스타일 및 JavaScript 대시보드 로직
performance_result.csv: 모델별 성능 비교 결과
final_results.csv: 수주량 예측 결과
