"""
실행법
    - 1. 프로젝트의 ROOT 폴더로 이동 | ~/KAMP
    - 2. cmd에 코드 실행           | python -m data.processed.01_missing_value_gubun_change
"""

"""
결측치 확인 및 대체
    - 데이터에 누락된 값(NaN)이 있는지 확인하고 품질 확보를 위해 처리함
    - 결측치가 30% 이상인 컬럼은 의미 있는 분석이 어렵다고 판단해 제거
    - 남은 결측치는 평균값, 중앙값, 보간법 등으로 대체하여 데이터 손실 최소화
"""

"""
Q. 결측치 제거 기준
    - null 비율이 30%인 값

Q. 왜 제거를 하는지?
    - null 값이 30% 이상인 데이터들은 완전성이 떨어지기 때문
    - 결측치가 많으면 통계값이 이상해짐 > 가능성 높음

Q. 왜 30%로 했는지?
    - 일반적으로 처리하는 기준 설명
        ○ 5%        | 무시 가능                         | 데이터에 거의 영항 없음
        ○ 5% ~ 30%  | 대체(평균값, 중앙값 등) 시도        | 대체 값으로 컬럼을 유지시킴
        ○ 30% ~ 50% | 삭제가 고려됨                     | 품질이 저하되고 예측이 왜곡될 수 있음
        ○ 50%       | 웬만한 상황 아니고서야 삭제를 해야함 | 이 데이터는 의미가 없음 걍 삭제

Q. 왜 범위를 지정하는지?
    - 데이터 손실이 커지고 시계열/패턴 정보가 망가질 가능성이 엄청 높음
"""

import os
import pandas as pd

# data.common에 작성된 코드 가져오기
from data.common import RAW_DIR, RESULT_DIR

# 원본 및 저장될 파일 경로 세팅
file_path       = os.path.join(RAW_DIR, "사출성형_공급망최적화_AI_데이터셋.csv")

output_mean     = os.path.join(RESULT_DIR, "01_01_전처리_결측치_평균값_대체.csv")
output_median   = os.path.join(RESULT_DIR, "01_02_전처리_결측치_중앙값_대체.csv")
output_interp   = os.path.join(RESULT_DIR, "01_03_전처리_결측치_보간법_대체.csv")

#####################################################################
# 원본 데이터셋 불러오고 세팅
#####################################################################

df = pd.read_csv(file_path, encoding = "utf-8-sig", na_values = ["", " ", "NA", "N/A", "na", "Na", "null", "NULL", "-", "--", "None"])

print(f"원본 데이터셋 로드 완료 / 행 개수 : {df.shape[0]}, 열 개수 : {df.shape[1]}")

# 문자열 형태의 결측 표현을 진짜 NaN으로 변환
df = df.replace(["", " ", "NA", "N/A", "na", "Na", "null", "NULL", "-", "--", "None", "nan", "NaN", "NAN"], pd.NA)

#####################################################################
# 결측치 값 확인
#####################################################################

# 컬럼별 결측치가 몇 개인지
col_missing = df.isna().sum()
print(f"원본 데이터셋 컬럼별 결측치 개수 : {col_missing}개")

# 결측치 총합
total_missing = df.isna().sum().sum()
print(f"총 결측치 개수 : {total_missing}개")

# 완전성 품질 % 계산
completeness = (1 - (total_missing / len(df))) * 100 # 계산식 > 완전성 = (1 - (결측치 개수 / 전체 행 수)) × 100
print(f"완전성 품질 % : {completeness:.2f}%")

#####################################################################
# 열 기준으로 결측치 비율 30% 이상인 컬럼 제거
#####################################################################

ratio_percent = 30  # 30% 기준
ratio_missing = (col_missing / len(df)) * 100 # 계산식 > (결측치 개수 / 전체 행 수) × 100
drop_cols = ratio_missing[ratio_missing > ratio_percent].index.tolist() # 30% 넘는 열만 저장

if drop_cols:
    print(f"결측치 비율 30% 초과 컬럼 제거: {drop_cols}")
    df.drop(columns=drop_cols, inplace=True)
else:
    print("결측치 비율 30% 초과 컬럼 없음")

#####################################################################
# 결측치 대체[평균값, 중앙값, 보간법(선형)] 총 3개
#####################################################################

# 평균값 대체
df_mean = df.fillna(df.mean(numeric_only=True))
print("평균값으로 대체 완료")

# 중앙값 대체
df_median = df.fillna(df.median(numeric_only=True))
print("중앙값으로 대체 완료")

# 보간법(선형)
df_interp = df.interpolate(method='linear')
print("보간법(선형)으로 대체 완료")

#####################################################################
# 결과 저장 
#####################################################################

df_mean.to_csv(output_mean, index=False, encoding="utf-8-sig")      # 평균값
df_median.to_csv(output_median, index=False, encoding="utf-8-sig")  # 중앙갑
df_interp.to_csv(output_interp, index=False, encoding="utf-8-sig")  # 보간법(선형)

print(f"💾 결측치 대체 데이터 저장 완료\n"
      f" - 평균값 대체  : {output_mean}\n"
      f" - 중앙값 대체 : {output_median}\n"
      f" - 보간밥 대체 : {output_interp}")

"""
결과는 결측치가 없다고 나옴.
결과에 대한 분석 > NaN에 해당하는 열이나 행이 없는 것으로 확인.

결측치가 존재하지 않으므로 평균값, 중앙값, 보간법은 쓰지 않는 것이 좋을 것 같음.
"""
