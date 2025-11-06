# 계속해서 세팅할 필요 없이 여기서 경로 설정을 다 해줌
import os

# ~/models 까지의 경로
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 출력 폴더 (학습 결과 저장)
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

# 데이터 폴더 (전처리 완료 CSV 불러오기용)
DATA_RESULT_DIR = os.path.join(os.path.dirname(BASE_DIR), "data", "results")