import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
from pathlib import Path
import sys
import os

# -----------------------------------------------
# Matplotlib 한글 폰트 설정
# -----------------------------------------------
def setup_korean_font():
    """운영체제에 맞는 한글 폰트를 설정합니다."""
    try:
        if os.name == 'nt':  # 윈도우
            matplotlib.rcParams['font.family'] = 'Malgun Gothic'
        elif os.name == 'posix':
            if sys.platform == 'darwin':  # 맥
                matplotlib.rcParams['font.family'] = 'AppleGothic'
            else:  # 리눅스 (나눔고딕이 설치되어 있다고 가정)
                matplotlib.rcParams['font.family'] = 'NanumGothic'
        else:
            matplotlib.rcParams['font.family'] = 'sans-serif'
    except Exception:
        print("[Warning] 한글 폰트를 설정하는 데 실패했습니다. LaTeX 내의 한글이 깨질 수 있습니다.")
        matplotlib.rcParams['font.family'] = 'sans-serif'
    
    # 유니코드 마이너스 기호 사용 설정
    matplotlib.rcParams['axes.unicode_minus'] = False
    print(f"현재 설정된 폰트: {matplotlib.rcParams['font.family']}")

# -----------------------------------------------
# LaTeX → PNG 변환 함수 (Matplotlib 사용)
# -----------------------------------------------
def latex_to_png(latex_string, output_png_path, dpi=300, fontsize=20):
    """
    Matplotlib를 사용하여 LaTeX 문자열을 고해상도 PNG 파일로 렌더링합니다.
    CSV에서 읽어온 문자열을 정규화하는 작업을 포함합니다.
    """
    output_png_path = Path(output_png_path)
    
    # 1. LaTeX 문자열 정규화
    # - 양 끝의 불필요한 따옴표( ") 제거
    # - CSV에서 이스케이프된 \\를 \로 변경 (Matplotlib는 \를 기대)
    cleaned_latex = latex_string.strip().strip('"').replace('\\\\', '\\')
    
    # - $...$로 감싸서 Matplotlib가 수식으로 인식하도록 함
    processed_latex = f"${cleaned_latex}$"

    # 2. 렌더링을 위한 Figure 준비
    fig, ax = plt.subplots(figsize=(10, 2), facecolor='none')
    ax.axis('off') # 축 숨기기

    try:
        # 3. 텍스트 렌더링
        ax.text(
            0.5, 0.5,
            processed_latex,
            fontsize=fontsize,
            ha='center',      # 수평 중앙 정렬
            va='center',      # 수직 중앙 정렬
            transform=ax.transAxes
        )

        # 4. 이미지 저장 (투명 배경, 여백 최소화)
        plt.savefig(
            output_png_path,
            dpi=dpi,
            bbox_inches='tight',  # 내용물에 맞게 이미지 자르기
            pad_inches=0.1,       # 약간의 여백
            transparent=True      # 배경 투명
        )
        print(f"[OK] PNG 생성 완료 → {output_png_path}")

    except Exception as e:
        print(f"[Error] LaTeX 렌더링 실패: {output_png_path.name}")
        print(f"  - 오류: {e}")
        print(f"  - 원본 LaTeX: {latex_string}")
        print(f"  - 처리된 LaTeX: {processed_latex}")
    
    finally:
        # 5. 메모리 해제를 위해 플롯 닫기
        plt.close(fig)

# -----------------------------------------------
# CSV의 모든 수식을 PNG로 변환
# -----------------------------------------------
def convert_csv_to_png(csv_path, output_dir="output_pngs"):
    """CSV 파일을 읽어 'problem_latex'와 'answer_latex' 컬럼의
    모든 수식을 PNG 이미지로 변환합니다."""
    
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True) # 출력 폴더 생성

    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print(f"[Error] CSV 파일을 찾을 수 없습니다: {csv_path}")
        return
    except Exception as e:
        print(f"[Error] CSV 파일 읽기 오류: {e}")
        return

    print(f"\n'{csv_path}' 파일에서 LaTeX 변환을 시작합니다...")

    for idx, row in df.iterrows():
        # 파일명으로 'id' 컬럼을 사용. 비어있을 경우 인덱스(idx) 사용
        file_id = row.get("id")
        if pd.isna(file_id):
            file_id = f"idx_{idx}"
        else:
            # id가 1.0처럼 float으로 읽힐 경우를 대비해 int로 변환
            try:
                file_id = int(file_id)
            except ValueError:
                file_id = f"id_{file_id}" # int 변환 실패 시
                
        prob_latex = str(row.get("problem_latex", "")).strip()
        ans_latex  = str(row.get("answer_latex", "")).strip()

        # 문제 PNG 생성 (내용이 있고, NaN이 아닐 경우)
        if prob_latex and pd.notna(row.get("problem_latex")):
            latex_to_png(prob_latex, output_dir / f"problem_{file_id}.png")

        # 정답 PNG 생성 (내용이 있고, NaN이 아닐 경우)
        if ans_latex and pd.notna(row.get("answer_latex")):
            latex_to_png(ans_latex, output_dir / f"answer_{file_id}.png")

    print("\n🎉 모든 수식 PNG 생성 완료!")
    print(f"결과물은 '{output_dir}' 폴더에서 확인하실 수 있습니다.")

# -----------------------------------------------
# 스크립트 실행
# -----------------------------------------------
if __name__ == "__main__":
    # 1. 한글 폰트 설정
    setup_korean_font()
    
    # 2. 변환 실행 (기본으로 'problems.csv' 파일을 사용)
    csv_filename = "problems.csv"
    
    if not Path(csv_filename).exists():
        print(f"[Error] 입력 파일 '{csv_filename}'을 찾을 수 없습니다.")
        print("스크립트와 동일한 디렉토리에 problems.csv 파일이 있는지 확인해주세요.")
    else:
        convert_csv_to_png(csv_filename)