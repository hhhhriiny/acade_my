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
        # 파라미터: student_id
        query = parse_qs(urlparse(self.path).query)
        student_id = query.get('student_id', [None])[0]
        
        if not student_id:
            self.send_response(400)
            self.end_headers()
            return

        # 1. [병렬 조회 효과] 학생 정보 & 커리큘럼 & 최근 기록 가져오기
        student_res = supabase.table('students').select('*').eq('id', student_id).single().execute()
        curriculum_res = supabase.table('curriculum').select('*').order('id').execute()
        logs_res = supabase.table('daily_logs').select('*').eq('student_id', student_id).order('created_at', desc=True).limit(1).execute()
        
        student = student_res.data
        curriculum = curriculum_res.data
        last_log = logs_res.data[0] if logs_res.data else None

        # 2. [AI 로직] 파이썬 내부에서 계산
        next_unit_ids = []
        reason = ""

        if not last_log:
            if curriculum:
                next_unit_ids = [curriculum[0]['id']]
                reason = "첫 수업이네요! 기초 단원부터 시작하는 것을 추천해요."
        else:
            last_units = last_log.get('selected_units', [])
            last_score = last_log.get('score', 0)
            last_max_id = max(last_units) if last_units else 0
            
            if last_score < 70:
                next_unit_ids = [last_max_id]
                reason = f"지난 성취도({last_score}점)가 낮아 복습을 추천합니다."
            else:
                # 다음 단원 찾기
                current_idx = next((i for i, item in enumerate(curriculum) if item['id'] == last_max_id), -1)
                if current_idx != -1 and current_idx < len(curriculum) - 1:
                    next_unit = curriculum[current_idx + 1]
                    next_unit_ids = [next_unit['id']]
                    reason = f"지난 수업({last_score}점) 이해도가 높습니다! '{next_unit['title']}' 진도를 추천합니다."
                else:
                    next_unit_ids = [last_max_id]
                    reason = "커리큘럼을 완주했습니다! 심화 학습 단계입니다."

        # 3. 데이터 패키징 (한 번에 반환)
        response_data = {
            "student": student,
            "curriculum": curriculum,
            "ai_recommendation": {
                "unit_ids": next_unit_ids,
                "reason": reason
            }
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

    def do_POST(self):
        # 평가 저장 로직
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))

        try:
            data, count = supabase.table('daily_logs').insert(body).execute()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))