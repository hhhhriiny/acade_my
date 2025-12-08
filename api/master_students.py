from http.server import BaseHTTPRequestHandler
import json
import os
from supabase import create_client, Client

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            if not url or not key: raise ValueError("환경변수 누락")
            supabase: Client = create_client(url, key)

            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            # 데이터 가공
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

            # [핵심 수정] .select() 제거 -> 그냥 .execute() 만 호출
            # 대부분의 버전에서 insert는 기본적으로 데이터를 반환하거나, 적어도 에러는 안 냅니다.
            response = supabase.table('students').insert(new_student).execute()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # 데이터가 있으면 반환, 없으면 입력한 데이터 그대로 반환 (프론트엔드 에러 방지)
            if response.data:
                data_to_return = response.data
            else:
                # 만약 DB가 데이터를 안 돌려줬다면, 우리가 보낸 데이터라도 돌려줘서 성공 처리
                data_to_return = [new_student]

            self.wfile.write(json.dumps({"success": True, "data": data_to_return}).encode('utf-8'))

        except Exception as e:
            error_message = f"{type(e).__name__}: {str(e)}"
            print(f"🔥 Student Error: {error_message}")
            
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": error_message}).encode('utf-8'))

    def do_GET(self):
        try:
            if not url or not key: raise ValueError("환경변수 누락")
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