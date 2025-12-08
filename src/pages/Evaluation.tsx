import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Sparkles, ChevronLeft, BookOpen, Smile, MessageSquare } from 'lucide-react';

export default function Evaluation() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  // 데이터 상태
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [curriculumList, setCurriculumList] = useState<any[]>([]);
  const [aiReason, setAiReason] = useState<string>("AI 분석 중...");

  // 입력 폼 상태
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);
  const [score, setScore] = useState(80);
  const [isSaved, setIsSaved] = useState(false);
  const [hasHomework, setHasHomework] = useState(false); 
  const [homeworkStatus, setHomeworkStatus] = useState('done');
  const [attitude, setAttitude] = useState('high');
  const [comment, setComment] = useState('');

  // 단 한 번의 호출로 모든 데이터 로딩 (Aggregated API)
  useEffect(() => {
    async function initPage() {
        if (!studentId) return;
        try {
            const res = await fetch(`/api/evaluate?student_id=${studentId}`);
            const data = await res.json();
            
            if (data) {
                setStudent(data.student);
                setCurriculumList(data.curriculum || []);
                // AI 추천 적용
                if (data.ai_recommendation) {
                    setSelectedUnits(data.ai_recommendation.unit_ids);
                    setAiReason(data.ai_recommendation.reason);
                }
            }
        } catch (e) {
            console.error("로딩 실패", e);
            setAiReason("서버 연결 실패");
        } finally {
            setLoading(false);
        }
    }
    initPage();
  }, [studentId]);

  // 저장 로직 (Python API)
  const handleSave = async () => {
    try {
        const res = await fetch('/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: studentId, 
                score, 
                selected_units: selectedUnits,
                homework: hasHomework ? homeworkStatus : 'none',
                attitude,
                teacher_comment: comment
            })
        });

        if (!res.ok) throw new Error("저장 실패");

        setIsSaved(true);
        setTimeout(() => navigate(-1), 1500);
    } catch (e) {
        alert("저장에 실패했습니다.");
    }
  };

  const toggleUnit = (id: number) => {
    setSelectedUnits(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  if (loading) return <div className="p-10 text-center text-gray-400 animate-pulse">AI가 학습 데이터를 분석하고 있습니다...</div>;
  if (!student) return <div className="p-10 text-center">학생 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-6 pb-24 relative animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50"><ChevronLeft size={20} /></button>
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{student.name}</h1>
                <p className="text-sm text-gray-500">{student.grade}</p>
            </div>
        </div>
      </div>

      {/* AI 리포트 */}
      <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-center mb-2 font-bold text-blue-100 text-sm uppercase tracking-wider">
                <Sparkles size={14} className="mr-2" /> AI Analysis
            </div>
            <p className="text-lg font-bold leading-relaxed">"{aiReason}"</p>
        </div>
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
      </div>

      {/* [반응형] 메인 컨텐츠 그리드: 모바일(1열) -> PC(2열) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 좌측: 진도 체크 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-bold mb-4 text-gray-800">진도 체크</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {curriculumList.map((unit) => {
                    const isSelected = selectedUnits.includes(unit.id);
                    return (
                        <div key={unit.id} onClick={() => toggleUnit(unit.id)}
                            className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer select-none ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold">{unit.category}</span>
                                <p className={`text-sm ${isSelected ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{unit.title}</p>
                            </div>
                            {isSelected && <Check size={16} className="text-blue-500" />}
                        </div>
                    )
                })}
            </div>
        </section>

        {/* 우측: 평가 항목들 */}
        <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">이해도 점수</h2>
                    <span className="text-2xl font-bold text-blue-600">{score}점</span>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-4xl animate-bounce-subtle">{score >= 90 ? '🤩' : score >= 70 ? '🙂' : score >= 50 ? '😐' : '😓'}</div>
                    <input type="range" min="0" max="100" value={score} onChange={(e) => setScore(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center"><BookOpen size={18} className="mr-2 text-gray-400"/> 숙제</h2>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={hasHomework} onChange={(e) => setHasHomework(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {hasHomework && (
                        <div className="flex space-x-2 animate-fade-in">
                            <button onClick={() => setHomeworkStatus('done')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${homeworkStatus === 'done' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-500'}`}>완료함 ⭕</button>
                            <button onClick={() => setHomeworkStatus('incomplete')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${homeworkStatus === 'incomplete' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200 text-gray-500'}`}>미흡함 ❌</button>
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center"><Smile size={18} className="mr-2 text-gray-400"/> 태도</h2>
                    <div className="flex space-x-2">
                        <button onClick={() => setAttitude('high')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${attitude === 'high' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 text-gray-500'}`}>좋음 👍</button>
                        <button onClick={() => setAttitude('middle')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${attitude === 'middle' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'border-gray-200 text-gray-500'}`}>보통 👌</button>
                        <button onClick={() => setAttitude('low')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${attitude === 'low' ? 'bg-gray-100 border-gray-400 text-gray-600' : 'border-gray-200 text-gray-500'}`}>아쉬움 😴</button>
                    </div>
                </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center"><MessageSquare size={18} className="mr-2 text-gray-400"/> 선생님 한마디</h2>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="코멘트 입력" className="w-full h-24 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 resize-none text-sm" />
            </section>
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-20">
        <div className="max-w-6xl mx-auto">
            <button onClick={handleSave} className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center ${isSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isSaved ? <span className="flex items-center justify-center"><Check size={24} className="mr-2" />저장 완료</span> : "평가 완료"}
            </button>
        </div>
      </div>
    </div>
  );
}