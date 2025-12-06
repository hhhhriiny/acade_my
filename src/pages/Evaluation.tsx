import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Check, Sparkles, ChevronLeft } from 'lucide-react';

export default function Evaluation() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<any>(null);
  const [curriculumList, setCurriculumList] = useState<any[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);
  const [score, setScore] = useState(80);
  const [isSaved, setIsSaved] = useState(false);
  
  // [에러 해결 부분] AI 분석 멘트 상태 정의가 빠져 있었습니다!
  const [aiReason, setAiReason] = useState<string>("AI가 학습 기록을 분석 중입니다...");

  useEffect(() => {
    async function fetchData() {
        if (!studentId) return;

        // 1. 학생 정보
        const { data: sData } = await supabase.from('students').select('*').eq('id', studentId).single();
        setStudent(sData);

        // 2. 전체 커리큘럼
        const { data: cData } = await supabase.from('curriculum').select('*').order('id');
        setCurriculumList(cData || []);

        // 3. Python API에게 AI 분석 요청
        try {
            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: studentId })
            });
            
            const aiData = await response.json();
            
            if (aiData.recommended_unit_ids) {
                setSelectedUnits(aiData.recommended_unit_ids);
            }
            if (aiData.reason) {
                setAiReason(aiData.reason);
            }
            
        } catch (error) {
            console.error("AI 서버 연결 실패:", error);
            setAiReason("AI 분석을 불러오지 못했습니다. (서버 연결 확인 필요)");
        }
    }
    fetchData();
  }, [studentId]);

  const handleSave = async () => {
    const { error } = await supabase.from('daily_logs').insert([{
        student_id: studentId, 
        score, 
        selected_units: selectedUnits
    }]);
    
    if (error) {
        alert("저장 실패!");
        return;
    }

    setIsSaved(true);
    setTimeout(() => navigate(-1), 1500);
  };

  const toggleUnit = (id: number) => {
    setSelectedUnits(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  if (!student) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50">
            <ChevronLeft size={20} />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-500">{student.grade}</p>
        </div>
      </div>

      {/* AI 리포트 카드 */}
      <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-center mb-2 font-bold text-blue-100 text-sm uppercase tracking-wider">
                <Sparkles size={14} className="mr-2" /> AI Analysis
            </div>
            <p className="text-lg font-bold leading-relaxed">"{aiReason}"</p>
        </div>
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 text-gray-800">진도 체크</h2>
            <div className="space-y-3">
                {curriculumList.map((unit) => {
                    const isSelected = selectedUnits.includes(unit.id);
                    return (
                        <div key={unit.id} onClick={() => toggleUnit(unit.id)}
                            className={`
                                group flex justify-between items-center p-4 rounded-xl border transition-all cursor-pointer select-none
                                ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white hover:border-blue-200'}
                            `}>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-bold">{unit.category}</span>
                                <p className={`font-medium text-lg ${isSelected ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{unit.title}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-200 bg-white'}`}>
                                {isSelected && <Check size={14} className="text-white" />}
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <h2 className="text-lg font-bold mb-4">오늘의 성취도 : <span className="text-blue-600">{score}점</span></h2>
            <div className="text-6xl mb-4">{score >= 90 ? '🤩' : score >= 70 ? '🙂' : score >= 50 ? '😐' : '😓'}</div>
            <input type="range" min="0" max="100" value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </section>
      </div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
            <button onClick={handleSave} className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg ${isSaved ? 'bg-green-500' : 'bg-blue-600'}`}>
                {isSaved ? "저장 완료!" : "평가 저장하기"}
            </button>
        </div>
      </div>
    </div>
  );
}