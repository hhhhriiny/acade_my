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
        # 검색어(query) 파싱
        query_params = parse_qs(urlparse(self.path).query)
        search_term = query_params.get('q', [''])[0]
        
        # 기본 쿼리: 이름순 정렬
        db_query = supabase.table('students').select('*').order('name')
        
        # 검색어가 있으면 필터링 (이름 or 전화번호)
        if search_term:
            # Supabase의 'or' 필터 사용 (이름에 포함되거나 OR 전화번호에 포함되거나)
            # ilike: 대소문자 무시하고 포함된 것 찾기 (%)
            db_query = db_query.or_(f"name.ilike.%{search_term}%,phone_number.ilike.%{search_term}%")
            
        response = db_query.execute()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response.data).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
        
        # [Python 로직] 학년 데이터 조립 ("중" + "1" -> "중1")
        school_type = body.get('school_type', '')
        grade_num = body.get('grade_num', '')
        final_grade = f"{school_type}{grade_num}" if school_type and grade_num else body.get('grade', '')
        
        # DB에 저장할 데이터 정리
        new_student = {
            "name": body.get('name'),
            "school_name": body.get('school_name'),
            "phone_number": body.get('phone_number'),
            "parent_phone_1": body.get('parent_phone_1'),
            "grade": final_grade,
            "avatar_color": body.get('avatar_color') # 프론트에서 랜덤 생성해서 줌
        }

        try:
            data, count = supabase.table('students').insert(new_student).execute()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))