from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime
from supabase import create_client, Client

# Vercel 환경변수 로드
url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# ★ 클래스 이름은 반드시 소문자 'handler' 여야 합니다!
class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            today_str = datetime.now().strftime('%Y-%m-%d')
            
            # 1. [오늘의 수업]
            # 파이썬의 weekday()는 월=0, 일=6
            days = ['월요일','화요일','수요일','목요일','금요일','토요일','일요일']
            today_kor = days[datetime.now().weekday()]
            
            # like 검색으로 오늘 요일이 포함된 수업 찾기
            classes_res = supabase.table('classes').select('*').ilike('schedule', f'%{today_kor}%').execute()
            today_classes_count = len(classes_res.data) if classes_res.data else 0

            # 2. [전체 원생 수]
            # count='exact' 옵션 사용
            students_res = supabase.table('students').select('id', count='exact').execute()
            total_students = students_res.count if students_res.count else 0

            # 3. [오늘 평가 현황]
            logs_res = supabase.table('daily_logs').select('*').gte('created_at', f"{today_str}T00:00:00").execute()
            today_eval_count = len(logs_res.data) if logs_res.data else 0

            # 4. [집중 케어 필요 학생] (Risk Analysis)
            risk_students = []
            
            # 최근 로그 50개 가져오기
            recent_logs = supabase.table('daily_logs')\
                .select('student_id, score, students(name, grade)')\
                .order('created_at', desc=True)\
                .limit(50)\
                .execute()
            
            if recent_logs.data:
                # 학생별 점수 집계
                student_scores = {}
                for log in recent_logs.data:
                    # student 데이터가 없을 경우(삭제된 학생 등) 방지
                    if not log.get('students'): continue
                    
                    sid = log['student_id']
                    if sid not in student_scores:
                        student_scores[sid] = {
                            'total': 0, 
                            'count': 0, 
                            'name': log['students']['name'], 
                            'grade': log['students']['grade']
                        }
                    student_scores[sid]['total'] += (log['score'] or 0)
                    student_scores[sid]['count'] += 1
                
                # 평균 70점 미만 추출
                for sid, info in student_scores.items():
                    if info['count'] > 0:
                        avg = info['total'] / info['count']
                        if avg < 70:
                            risk_students.append({
                                'name': info['name'],
                                'grade': info['grade'],
                                'avg': round(avg, 1)
                            })

            # 결과 반환
            response_data = {
                "today_classes": today_classes_count,
                "total_students": total_students,
                "today_evals": today_eval_count,
                "risk_students": risk_students
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

        except Exception as e:
            # 에러 발생 시 500 에러와 함께 메시지 출력 (디버깅용)
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))