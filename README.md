# AIX_FIRST_PROJECT

---

## 프로젝트 소개

사출성형 산업의 공급망 데이터를 분석하여 **수주량을 예측**하는 머신러닝 시스템입니다.

**LightGBM**, **CatBoost**, **Random Forest** 모델을 활용하며, FastAPI 기반 웹 대시보드로 예측 결과를 시각화합니다.

---

## 환경 설정

### 1. Anaconda 설치

> [Anaconda 공식 사이트](https://www.anaconda.com/download)에서 설치

### 2. 가상환경 생성 및 활성화

```bash
conda create -n AIX_FIRST_PROJECT_310 python=3.10 -y
conda activate AIX_FIRST_PROJECT_310
python -m pip install --upgrade pip
```

### 3. 패키지 설치

```bash
pip install -r requirements/requirements.txt
```

---

## 실행 방법

```bash
uvicorn backend.main:app --reload
```

브라우저에서 접속: **`http://127.0.0.1:8000`**

---

## 프로젝트 구조

```
AIX_FIRST_PROJECT/
│   ├── backend/         # 웹 및 FastAPI 관련 파일
│   │   ├── static/      # css, image, js 관련 파일
│   │   │   ├── css/     # css 파일
│   │   │   ├── image/   # image 파일
│   │   │   └── js/      # js 파일
│   └── └── templates/   # HTML 템플릿

├── data/             # 전처리/데이터셋 관련 파일
│   ├── processed/    # 전처리 하는 python 파일
│   ├── raw/          # 데이터셋 원본 csv 데이터
│   └── results/      # 전처리된 csv 데이터

├── models/                                # ML 모델 학습 및 예측 코드
│   ├── outputs/                           # 학습된 모델 저장
│   │   ├── tab_a_catboost_forecast/       # catboost 학습 데이터
│   │   ├── tab_a_ensemble_forecast/       # lightgbm + catboost 앙상블 데이터
│   │   ├── tab_a_lightgbm_forecast/       # lightgbm 학습 데이터
│   └── └── tab_b_randomforest_forecast/   # random forest 학습 데이터

└── requirements/  # 라이브러리 관련 파일
```

---

## 기술 스택

**Backend**
- FastAPI
- Uvicorn

**Machine Learning**
- LightGBM
- CatBoost
- Random Forest

**Frontend**
- HTML, CSS, JavaScript
- Chart.js

---
