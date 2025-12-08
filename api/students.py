from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime, timezone
from supabase import create_client, Client
from urllib.parse import urlparse, parse_qs

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # URL 파라미터 파싱
        query = parse_qs(urlparse(self.path).query)
        mode = query.get('mode', ['list'])[0] # 'list'(반 학생) or 'available'(배정 가능 학생)
        class_id = query.get('class_id', [None])[0]
        
        data_to_return = []

        if mode == 'list' and class_id:
            # [기능 1] 반에 소속된 학생 목록 + 오늘 평가 완료 여부 확인
            
            # 1. 학생 목록 가져오기
            st_res = supabase.table('students').select('*').eq('class_id', class_id).order('name').execute()
            students = st_res.data
            
            # 2. 오늘 날짜 기록 확인 (Python에서 날짜 처리)
            today_str = datetime.now().strftime('%Y-%m-%d')
            
            # 오늘자 로그 가져오기
            log_res = supabase.table('daily_logs')\
                .select('student_id')\
                .in_('student_id', [s['id'] for s in students])\
                .gte('created_at', f"{today_str}T00:00:00")\
                .execute()
            
            completed_ids = [log['student_id'] for log in log_res.data]
            
            # 3. 데이터 합치기
            for s in students:
                s['isCompleted'] = s['id'] in completed_ids
            
            data_to_return = students

        elif mode == 'available':
            # [기능 2] 배정 가능한 학생 목록 + 스마트 정렬(추천)
            target_grade = query.get('target_grade', [''])[0] # 예: "중1"
            
            # 반이 없는 학생들 조회
            res = supabase.table('students').select('*').is_('class_id', 'null').order('grade').execute()
            available_students = res.data
            
            # Python 정렬: 타겟 학년과 일치하면 우선순위 높임
            def sort_key(student):
                # 일치하면 0 (맨 앞), 아니면 1
                return 0 if student.get('grade') == target_grade else 1
            
            data_to_return = sorted(available_students, key=sort_key)

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data_to_return).encode('utf-8'))

    def do_POST(self):
        # 학생 반 배정 (업데이트)
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
        
        student_ids = body.get('student_ids', [])
        class_id = body.get('class_id')
        
        if student_ids and class_id:
            supabase.table('students')\
                .update({'class_id': class_id})\
                .in_('id', student_ids)\
                .execute()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"success": True}).encode('utf-8'))