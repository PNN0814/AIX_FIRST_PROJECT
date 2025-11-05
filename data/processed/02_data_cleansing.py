"""
실행법
    - 1. 프로젝트의 ROOT 폴더로 이동 | ~/KAMP
    - 2. cmd에 코드 실행           | python -m data.processed.02_data_cleansing
"""

"""
데이터 정제 (Data Cleansing)
    - 결측치 제거 이후 남은 데이터의 구조적 품질을 향상시키기 위한 과정
    - 중복, 불연속성, 단위 불일치, 정밀도 차이 등을 보정해
      모델 학습에 적합한 형태로 데이터 구조를 안정화시킴
"""

"""
Q. 왜 정제를 하는가?
    - 데이터 내 중복, 불연속, 형식 불일치 등은 예측 모델에 왜곡을 일으킴
    - 결측치 제거만으로는 구조적 이상을 해결할 수 없기 때문에 정제가 필요함
    - 특히 사출성형 공정 데이터는 시간순·연속성이 중요한 특성을 가짐

Q. 정제 시 포함되는 주요 처리 과정
    DateTime 컬럼 분리
        - yyyy-mm-dd / hh:mm:ss 형태로 변환
        - 날짜(Date)와 시간(Time)을 구분해 시계열 정렬이 용이하도록 구성
    
    하루 중 중복 데이터 제거
        - 동일 제품(Product_Number) + 같은 날짜(Date) 중 여러 번 기록된 경우
        - 가장 마지막(Time이 가장 늦은) 데이터만 유지
        - 의미 없는 중복 데이터는 이상치처럼 작용하므로 제거
    
    연속 수집 안 된 제품 제거
        - 모든 제품은 95일 연속 측정되어야 함
        - 하루라도 결측된 경우 해당 제품 전체를 제거 (불연속 데이터 제거)
    
    데이터 형식 정제
        - 수주량 관련 컬럼은 단위가 ‘개수’ 단위이므로 소수점은 의미가 없음
          → 소수점 제거 후 정수형으로 통일
        - Temperature, Humidity는 센서 정밀도 차이로 인해
          소수점 자릿수가 불규칙하므로 3자리로 통일하여 정규화
          → 과도한 정밀도(불필요한 노이즈) 제거, 단위 일관성 확보
    
    데이터 재배열
        - “T+1”, “T+2” 같은 미래 시점을 현재(T일) 기준으로 정렬
        - 시계열 패턴을 예측용으로 재구성

Q. 왜 이 순서로 해야 하는가?
    - 결측치 제거 후 정제 → 데이터의 완전성 확보 후 구조 안정화
    - 이상치 제거는 통계적 판단이 필요하므로 정제 이후에 별도 진행

Q. 결과
    - 완전한 형태의 시계열 구조를 가진 정제 데이터셋 생성
    - 단위(정수/소수) 및 정밀도가 통일된 상태로 모델 학습에 바로 활용 가능
    - 이후 이상치 탐지(Outlier Detection) 및 스케일링 단계로 연계됨
"""


import os
import pandas as pd

# data.common 에서 경로 불러오기
from data.common import RESULT_DIR

#####################################################################
# 파일 경로 설정
#####################################################################

# 결측치 제거 완료 데이터셋 불러오기
file_path = os.path.join(RESULT_DIR, "01_00_전처리_결측치_제거.csv")

# 저장될 파일명 및 위치
output_path = os.path.join(RESULT_DIR, "02_전처리_데이터_정제.csv")

#####################################################################
# 데이터 불러오기
#####################################################################

df = pd.read_csv(file_path, encoding = "utf-8-sig")

print(f"데이터 로드 완료 / 행 : {df.shape[0]}, 열 : {df.shape[1]}")

#####################################################################
# DateTime 컬럼 분리 (Date / Time)
#####################################################################

if "DateTime" not in df.columns:
    raise ValueError("DateTime 컬럼이 존재하지 않습니다. 원본 파일을 확인하세요.")

# 문자열 포맷 불일치 대비 : mixed 모드로 안전하게 변환
df["DateTime"] = pd.to_datetime(df["DateTime"], format = "mixed", errors = "coerce")

# 변환에 실패한 행이 있는지 확인
if df["DateTime"].isna().any():
    print("일부 DateTime 값이 변환되지 않았습니다. 원본 데이터를 확인하세요.")

# Date / Time 컬럼 생성
df["Date"] = df["DateTime"].dt.strftime("%Y-%m-%d")
df["Time"] = df["DateTime"].dt.strftime("%H:%M:%S")

# DateTime이 있던 자리에 Date, Time, DoW 순서로 삽입
columns = list(df.columns)

# 중복 방지를 위해 기존 Date, Time, DoW 존재 시 제거
for col_name in ["Date", "Time", "DoW"]:
    if col_name in columns:
        columns.remove(col_name)

# DateTime이 있던 위치 인덱스 찾기
datetime_index = columns.index("DateTime")

# DateTime 제거
columns.remove("DateTime")

# Date, Time, DoW를 해당 위치에 삽입
if "DoW" in df.columns:
    columns[datetime_index:datetime_index] = ["Date", "Time", "DoW"]
else:
    columns[datetime_index:datetime_index] = ["Date", "Time"]

# 새로운 컬럼 순서로 재배열
df = df[columns]

print(f"DateTime > Date, Time 생성 및 재배치 완료 / 총 컬럼 수 : {df.shape[1]}")

#####################################################################
# 하루 중 중복 데이터 제거 (마지막 Time만 유지)
#####################################################################

# 정렬 후 중복 제거
df.sort_values(by = ["Product_Number", "Date", "Time"], inplace = True)

df = df.drop_duplicates(subset = ["Product_Number", "Date"], keep = "last")

df.reset_index(drop = True, inplace = True)

print(f"하루 중 중복 데이터 제거 / 행 수: {df.shape[0]}")

#####################################################################
# 연속 수집 안 된 제품 제거 (95일 미만)
#####################################################################

# 각 제품별 데이터 개수 확인
product_list = df["Product_Number"].unique()
drop_list = []

for product in product_list:
    count = df["Product_Number"].value_counts()[product]
    if count != 95:
        drop_list.append(product)

if drop_list:
    df = df[~df["Product_Number"].isin(drop_list)]
    df.reset_index(drop = True, inplace = True)
    print(f"95일 미만 수집 제품 제거 / 제거된 제품 수 : {len(drop_list)} / 남은 행 수 : {df.shape[0]}")
else:
    print("모든 제품이 95일 연속 수집됨")

#####################################################################
# 데이터 형식 정제 (수주량 / 온도 / 습도 단위 통일)
#####################################################################

# 수주량 관련 컬럼의 소수점 제거 (정수형 변환)
order_columns = []

# 수주량 관련 컬럼 추가
for col in df.columns:
    if "수주량" in col:
        order_columns.append(col)

# 값 체크해서 정수형으로 변환
for col in order_columns:
    df[col] = df[col].round(0).astype(int)

print(f"수주량 관련 컬럼 {len(order_columns)}개 정수형 변환 완료")

# Temperature, Humidity 소수점 자리수 통일 (3자리)
for col in df.columns:
    if col.lower() in ["temperature", "humidity"]:
        df[col] = df[col].round(3)

print("Temperature, Humidity 컬럼 소수점 자리수 3자리로 통일 완료")

#####################################################################
# 데이터 정렬 (시계열 순서 유지)
#####################################################################

# Product_Number, Date, Time 기준으로 시간순 정렬만 수행
# 컬럼 단위 shift는 생략 (이미 T~T+4 형태로 구성되어 있음)
df.sort_values(by=["Product_Number", "Date", "Time"], inplace=True)
df.reset_index(drop=True, inplace=True)

print(f"데이터 시계열 정렬 완료 (Shift 미적용, 컬럼 값 유지) / 행 수 : {df.shape[0]}")

# time_series_df 변수로 이름 통일 (아래 코드와 동일 구조 유지)
time_series_df = df.copy()

#####################################################################
# 결과 저장
#####################################################################

time_series_df.to_csv(output_path, index=False, encoding="utf-8-sig")

print(f"데이터 정제 완료 및 저장: {output_path}")

"""
결과 분석
    - DateTime 컬럼 분리 및 하루 중 중복 제거 완료
    - 수주량 컬럼의 단위가 정수형으로 정제되고, 온도/습도 컬럼의 정밀도가 통일됨
    - 95일 미만으로 수집된 제품은 모두 제거되어 연속성이 확보됨
    - Date, Time, DoW 컬럼이 시간 관련 구역으로 재배치되어 구조적 일관성 확보
    - 시계열 정렬(T~T+4 컬럼 구조 유지)까지 완료되어, 학습용 형태로 정돈된 데이터셋 생성됨

결론
    - 본 파일은 결측치 제거 이후 구조적 이상요소(중복, 불연속, 단위 불일치, 정밀도 차이)를 정제한 데이터셋임
    - 이후 단계(이상치 탐지 및 제거)는 이 결과 파일을 기준으로 진행하는 것이 적절함
"""