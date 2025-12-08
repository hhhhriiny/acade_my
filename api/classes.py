from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime
from supabase import create_client, Client

# 환경변수 로드 (Vercel 환경)
url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 1. DB에서 모든 수업 데이터 가져오기 (날 것의 데이터)
        response = supabase.table('classes').select('*').execute()
        classes = response.data

        # 2. [Python의 강력한 기능] 스마트 정렬 로직 수행
        # 요일 매핑 (Python은 월요일=0, 일요일=6)
        # 하지만 우리가 저장한 건 텍스트이므로 매핑 테이블 필요
        day_map = { '월요일': 0, '화요일': 1, '수요일': 2, '목요일': 3, '금요일': 4, '토요일': 5, '일요일': 6 }
        
        today = datetime.now()
        current_day_idx = today.weekday() # 0~6

        def get_min_dist(schedule_str):
            # "월요일 오후 07:00 / 수요일 오후 07:00" 같은 문자열 파싱
            if not schedule_str: return 999
            
            slots = schedule_str.split(' / ')
            min_dist = 999
            
            for slot in slots:
                parts = slot.split(' ') # ['월요일', '오후', '07:00']
                if not parts: continue
                
                day_name = parts[0]
                target_idx = day_map.get(day_name, 99)
                
                # 오늘로부터 며칠 뒤인가? (0이면 오늘)
                dist = (target_idx - current_day_idx + 7) % 7
                if dist < min_dist:
                    min_dist = dist
            return min_dist

        # Python의 sort는 매우 빠르고 효율적입니다.
        sorted_classes = sorted(classes, key=lambda x: get_min_dist(x.get('schedule', '')))

        # 3. 정렬된 깨끗한 데이터 반환
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(sorted_classes).encode('utf-8'))

    # POST: 수업 추가 (이건 간단하니까 바로 처리)
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))

        data, count = supabase.table('classes').insert(body).execute()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data[1][0]).encode('utf-8'))