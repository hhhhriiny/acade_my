import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Check, Sparkles, ChevronLeft } from 'lucide-react';

export default function Evaluation() {
  const { studentId } = useParams(); // URL에서 학생 ID 받기
  const navigate = useNavigate();
  
  // 상태 관리
  const [student, setStudent] = useState<any>(null);
  const [curriculumList, setCurriculumList] = useState<any[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);
  const [score, setScore] = useState(80);
  const [isSaved, setIsSaved] = useState(false);

  // ... 기존 import 유지

// useEffect 내부 수정
useEffect(() => {
    async function fetchData() {
        if (!studentId) return;

        // 1. 학생 정보는 보여줘야 하니까 가져옴
        const { data: sData } = await supabase.from('students').select('*').eq('id', studentId).single();
        setStudent(sData);

        // 2. 전체 커리큘럼 목록 가져오기
        const { data: cData } = await supabase.from('curriculum').select('*').order('id');
        setCurriculumList(cData || []);

        // 3. [변경] Python API에게 AI 분석 요청하기!
        try {
            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: studentId })
            });
            
            const aiData = await response.json();
            
            // Python이 알려준 대로 세팅
            setSelectedUnits(aiData.recommended_unit_ids);
            setAiReason(aiData.reason);
            
        } catch (error) {
            console.error("AI 서버 연결 실패:", error);
            setAiReason("AI 분석을 불러오지 못했습니다.");
        }
    }
    fetchData();
}, [studentId]);

  const handleSave = async () => {
    await supabase.from('daily_logs').insert([{
        student_id: studentId, score, selected_units: selectedUnits
    }]);
    setIsSaved(true);
    setTimeout(() => navigate(-1), 1000); // 1초 뒤 뒤로가기
  };

  const toggleUnit = (id: number) => {
    setSelectedUnits(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  if (!student) return <div className="p-10 text-center">학생 정보를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24">
      {/* 헤더 */}
      <header className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 mr-2"><ChevronLeft /></button>
            <div>
                <h1 className="text-lg font-bold">{student.name}</h1>
                <p className="text-xs text-gray-500">{student.grade}</p>
            </div>
        </div>
      </header>

      <div className="p-5 space-y-6">
        {/* 진도 */}
        <section className="bg-white p-5 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center">
                오늘의 진도 <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md">AI 추천</span>
            </h2>
            <div className="space-y-3">
                {curriculumList.map((unit) => {
                    const isSelected = selectedUnits.includes(unit.id);
                    return (
                        <div key={unit.id} onClick={() => toggleUnit(unit.id)}
                            className={`flex justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                            <div>
                                <span className="text-xs text-gray-400 font-bold">{unit.category}</span>
                                <p className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{unit.title}</p>
                            </div>
                            {isSelected && <Check size={20} className="text-blue-500" />}
                        </div>
                    )
                })}
            </div>
        </section>

        {/* 점수 */}
        <section className="bg-white p-5 rounded-2xl shadow-sm text-center">
            <h2 className="text-lg font-bold mb-4">오늘의 성취도 : <span className="text-blue-600">{score}점</span></h2>
            <div className="text-6xl mb-4">{score >= 80 ? '🤩' : score >= 50 ? '🙂' : '😓'}</div>
            <input type="range" min="0" max="100" value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </section>
      </div>

      {/* 저장 버튼 */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t">
        <button onClick={handleSave} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg ${isSaved ? 'bg-green-500' : 'bg-blue-600'}`}>
            {isSaved ? "저장 완료!" : "평가 저장하기"}
        </button>
      </div>
    </div>
  );
}