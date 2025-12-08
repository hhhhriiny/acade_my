# debug_db.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv() # .env 파일 로드

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

print(f"Testing Connection to: {url}")

try:
    supabase: Client = create_client(url, key)
    
    # 1. 수업 개설 시도 (Insert Test)
    test_data = {
        "name": "테스트반",
        "schedule": "테스트 시간",
        "target_grade": "중1"
    }
    print("1. 데이터 삽입 시도중...")
    data, count = supabase.table('classes').insert(test_data).execute()
    print("✅ 삽입 성공:", data)

    # 2. 조회 시도 (Select Test)
    print("2. 데이터 조회 시도중...")
    res = supabase.table('classes').select("*").execute()
    print(f"✅ 조회 성공: 총 {len(res.data)}개의 수업이 있습니다.")

except Exception as e:
    print("❌ 에러 발생!")
    print(e)