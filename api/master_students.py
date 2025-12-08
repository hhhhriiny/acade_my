from http.server import BaseHTTPRequestHandler
import json
import os
from supabase import create_client, Client

# 환경변수 로드
url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 1. Supabase 연결 확인
            if not url or not key:
                raise ValueError("Supabase 환경변수가 없습니다.")
            
            supabase: Client = create_client(url, key)

            # 2. 데이터 수신
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            # 3. 데이터 가공
            school_type = body.get('school_type', '')
            grade_num = body.get('grade_num', '')
            final_grade = f"{school_type}{grade_num}" if school_type and grade_num else body.get('grade', '')
            
            new_student = {
                "name": body.get('name'),
                "school_name": body.get('school_name'),
                "phone_number": body.get('phone_number'),
                "parent_phone_1": body.get('parent_phone_1'),
                "grade": final_grade,
                "avatar_color": body.get('avatar_color')
            }

            # 4. DB 저장 시도 (가장 중요한 부분)
            # .select()는 저장된 데이터를 반환하라는 명령입니다.
            print(f"Attempting to insert: {new_student}") # Vercel 로그에 기록
            response = supabase.table('students').insert(new_student).select().execute()
            
            # 5. 성공 응답
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # 데이터가 리스트인지 확인하고 안전하게 반환
            responseData = response.data if response.data else []
            self.wfile.write(json.dumps({"success": True, "data": responseData}).encode('utf-8'))

        except Exception as e:
            # 6. 에러 발생 시 로그 출력 (이걸 봐야 원인을 압니다)
            print(f"🔥 CRITICAL ERROR: {str(e)}") 
            
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    # GET 메서드는 기존 로직 유지 (생략 가능하나 전체 파일 교체시 필요하면 넣어드립니다)
    def do_GET(self):
        try:
            if not url or not key: raise ValueError("No Env Vars")
            supabase: Client = create_client(url, key)
            from urllib.parse import urlparse, parse_qs
            query_params = parse_qs(urlparse(self.path).query)
            search_term = query_params.get('q', [''])[0]
            
            db_query = supabase.table('students').select('*').order('name')
            if search_term:
                db_query = db_query.or_(f"name.ilike.%{search_term}%,phone_number.ilike.%{search_term}%")
            response = db_query.execute()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response.data).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))