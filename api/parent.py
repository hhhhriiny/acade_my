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
        query = parse_qs(urlparse(self.path).query)
        parent_id = query.get('parent_id', [None])[0]
        selected_child_id = query.get('child_id', [None])[0]

        if not parent_id:
            self.send_response(400)
            self.end_headers()
            return

        response_data = {
            "children": [],
            "logs": [],
            "stats": {"avgScore": 0, "attendance": 0}
        }

        # 1. 자녀 목록 가져오기 (반 정보 포함)
        # Note: supabase-py에서는 nested query 문법이 조금 다를 수 있어 안전하게 따로 호출하거나 조인 사용
        # 여기서는 간단하게 students 가져오고 class info는 필요시 추가 조회하는 방식 추천하지만,
        # MVP 속도를 위해 join string 사용
        children_res = supabase.table('students')\
            .select('*, classes(name, schedule)')\
            .eq('parent_user_id', parent_id)\
            .execute()
        
        response_data["children"] = children_res.data

        # 2. 특정 자녀의 데이터 분석 (child_id가 있거나, 자녀가 1명이면 자동 선택)
        target_id = selected_child_id if selected_child_id else (children_res.data[0]['id'] if children_res.data else None)

        if target_id:
            # 최근 30개 기록 조회
            logs_res = supabase.table('daily_logs')\
                .select('*')\
                .eq('student_id', target_id)\
                .order('created_at', desc=True)\
                .limit(30)\
                .execute()
            
            logs = logs_res.data
            response_data["logs"] = logs

            # [Python 통계 계산]
            if logs:
                scores = [log['score'] for log in logs if log['score'] is not None]
                avg_score = sum(scores) / len(scores) if scores else 0
                response_data["stats"] = {
                    "avgScore": round(avg_score),
                    "attendance": len(logs)
                }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))