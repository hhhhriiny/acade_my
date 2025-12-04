from http.server import BaseHTTPRequestHandler
import json
import os
from supabase import create_client, Client

# Vercel이 자동으로 환경변수를 가져옵니다.
url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 1. 프론트엔드에서 보낸 데이터(학생 ID) 받기
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
        student_id = body.get('student_id')

        # 2. DB에서 데이터 가져오기 (학생의 과거 기록 & 전체 커리큘럼)
        # (이 부분은 Python이라 데이터 분석 라이브러리 pandas 등을 쓰기 아주 좋습니다)
        logs_response = supabase.table('daily_logs')\
            .select('*')\
            .eq('student_id', student_id)\
            .order('created_at', desc=True)\
            .limit(5)\
            .execute() # 최근 5건 조회 (패턴 분석용)
            
        curriculum_response = supabase.table('curriculum').select('*').order('id').execute()
        
        logs = logs_response.data
        curriculum = curriculum_response.data
        
        # 3. [핵심] 진도 추천 알고리즘 (Python Logic)
        next_unit_ids = []
        reason = ""

        if not logs:
            # 기록 없으면 1단원
            if curriculum:
                next_unit_ids = [curriculum[0]['id']]
                reason = "첫 수업이네요! 커리큘럼의 첫 단원부터 시작합니다."
        else:
            last_log = logs[0]
            last_units = last_log.get('selected_units', [])
            last_score = last_log.get('score', 0)
            
            # 마지막으로 배운 단원의 ID (여러 개면 가장 큰 숫자 기준)
            last_max_id = max(last_units) if last_units else 0
            
            # --- [대표님의 철학이 담긴 알고리즘] ---
            # "보통 전날 수업한 내용 복습 혹은 다음 내용을 학습하니까..."
            
            if last_score < 70:
                # 점수가 낮으면 -> 선생님은 보통 '복습'을 선택할 것이다.
                next_unit_ids = [last_max_id]
                reason = f"지난 수업 성취도({last_score}점)가 조금 부족했어요. 오늘은 확실히 복습하고 넘어갈까요?"
            else:
                # 점수가 높으면 -> 선생님은 '다음 진도'를 선택할 것이다.
                # 현재 단원의 다음 단원 찾기
                current_idx = next((i for i, item in enumerate(curriculum) if item['id'] == last_max_id), -1)
                
                if current_idx != -1 and current_idx < len(curriculum) - 1:
                    next_unit = curriculum[current_idx + 1]
                    next_unit_ids = [next_unit['id']]
                    reason = f"지난 수업({last_score}점)을 완벽히 소화했네요! 오늘은 '{next_unit['title']}' 진도를 나갈 차례입니다."
                else:
                    # 다음 단원이 없으면 (마지막 단원)
                    next_unit_ids = [last_max_id]
                    reason = "커리큘럼을 모두 마쳤습니다! 심화 학습을 진행해볼까요?"

        # 4. 결과 돌려주기
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response_data = {
            "recommended_unit_ids": next_unit_ids,
            "reason": reason
        }
        self.wfile.write(json.dumps(response_data).encode('utf-8'))