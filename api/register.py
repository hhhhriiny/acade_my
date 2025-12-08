from http.server import BaseHTTPRequestHandler
import json
import os
from supabase import create_client, Client

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
        
        user_id = body.get('user_id')
        role = body.get('role')
        phone = body.get('phone')

        if not user_id or not role:
            self.send_response(400)
            self.end_headers()
            return

        try:
            # 1. 역할(Role) 저장
            supabase.table('user_roles').insert({'id': user_id, 'role': role}).execute()

            # 2. [비즈니스 로직] 학부모일 경우 자녀 자동 매칭
            match_count = 0
            if role == 'parent' and phone:
                # 전화번호가 일치하는 학생 찾아서 부모 ID 업데이트
                # (하이픈 '-' 유무와 상관없이 찾기 위해 간단한 처리 가능하지만 여기선 그대로 매칭)
                res = supabase.table('students')\
                    .update({'parent_user_id': user_id})\
                    .eq('parent_phone_1', phone)\
                    .execute()
                match_count = len(res.data)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "matched": match_count}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))