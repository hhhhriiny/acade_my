from http.server import BaseHTTPRequestHandler
import json
import os
from supabase import create_client, Client
from urllib.parse import urlparse, parse_qs

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
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

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
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

            # [수정된 부분] insert().execute() 결과를 변수 하나(response)로 받습니다.
            response = supabase.table('students').insert(new_student).execute()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            # response.data를 반환
            self.wfile.write(json.dumps({"success": True, "data": response.data}).encode('utf-8'))

        except Exception as e:
            # 에러 내용을 터미널/로그에 출력
            print(f"Server Error: {str(e)}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))