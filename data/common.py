# 계속해서 세팅할 필요 없이 여기서 경로 설정을 다 해줌
import os

# ~/data 까지의 디렉토리
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 각 폴더에 맞게 디렉토리 세팅
PROCESSED_DIR   = os.path.join(BASE_DIR, "processed")   # 전처리 관련 코드 디렉토리
RAW_DIR         = os.path.join(BASE_DIR, "raw")         # 전처리 전 원본 csv 디렉토리
RESULT_DIR      = os.path.join(BASE_DIR, "results")     # 전처리 후 csv 디렉토리