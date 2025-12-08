import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ChevronLeft, UserPlus, GraduationCap, CheckCircle, Clock, X } from 'lucide-react';

export default function StudentList() {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  const [className, setClassName] = useState('');
  const [targetGrade, setTargetGrade] = useState(''); 
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // [최적화 1] 학생 목록 불러오기 (Python API 호출)
  const fetchData = async () => {
    if (!classId) return;
    
    // 1. 반 정보는 간단하니까 Supabase 직접 호출 (또는 이것도 API로 뺄 수 있음)
    const { data: clsData } = await supabase.from('classes').select('*').eq('id', classId).single();
    if (clsData) {
        setClassName(clsData.name);
        setTargetGrade(clsData.target_grade || '');
    }

    // 2. 학생 목록 (상태 포함) API 호출
    try {
        const res = await fetch(`/api/students?mode=list&class_id=${classId}`);
        const data = await res.json();
        setClassStudents(data || []);
    } catch (e) {
        console.error("학생 로딩 실패", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  // [최적화 2] 학생 배정 모달 열기 (API 호출)
  const openImportModal = async () => {
    try {
        // 백엔드에서 이미 정렬(추천순)해서 줍니다.
        const res = await fetch(`/api/students?mode=available&target_grade=${encodeURIComponent(targetGrade)}`);
        const data = await res.json();
        setAvailableStudents(data || []);
        setSelectedStudentIds([]);
        setIsModalOpen(true);
    } catch (e) {
        alert("목록을 불러오지 못했습니다.");
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  // [최적화 3] 배정 실행 (API 호출)
  const handleAddStudentsToClass = async () => {
    if (selectedStudentIds.length === 0) return;
    try {
      await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_ids: selectedStudentIds, class_id: classId })
      });
      
      alert(`${selectedStudentIds.length}명의 학생이 배정되었습니다.`);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("배정 실패!");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col relative pb-20">
      {/* 헤더 */}
      <header className="bg-white p-4 border-b border-gray-200 sticky top-0 flex items-center justify-between z-10">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800 truncate max-w-[150px] md:max-w-none">{loading ? '로딩 중...' : className}</h1>
            <div className="flex items-center text-xs text-gray-500 space-x-2">
                <span>학생 {classStudents.length}명</span>
                {targetGrade && <span className="hidden md:inline-block bg-blue-50 text-blue-600 px-1.5 rounded font-bold">대상: {targetGrade}</span>}
            </div>
          </div>
        </div>
        <button 
          onClick={openImportModal}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          <UserPlus size={16} className="mr-1" /> <span className="hidden md:inline">원생 </span>배정
        </button>
      </header>
      
      {/* 학생 리스트 (반응형 그리드) */}
      <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {classStudents.map((student) => (
          <div 
            key={student.id}
            onClick={() => navigate(`/evaluation/${student.id}`)}
            className={`
                group p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center aspect-square active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden
                ${student.isCompleted ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md'}
            `}
          >
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${student.avatar_color || 'bg-gray-100'} flex items-center justify-center text-xl md:text-2xl font-bold mb-3 shadow-inner relative`}>
              {student.name[0]}
              {student.isCompleted && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 border-2 border-white">
                      <CheckCircle size={12} />
                  </div>
              )}
            </div>
            <span className={`font-bold text-sm md:text-base transition-colors ${student.isCompleted ? 'text-blue-800' : 'text-gray-900 group-hover:text-blue-600'}`}>
                {student.name}
            </span>
            <div className="mt-2 flex items-center text-[10px] md:text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-md">
                <GraduationCap size={10} className="mr-1"/> {student.grade}
            </div>
            <div className={`absolute top-2 right-2 md:top-3 md:right-3 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold flex items-center ${student.isCompleted ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                {student.isCompleted ? <>완료</> : <>대기</>}
            </div>
          </div>
        ))}
        
        {classStudents.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center text-gray-400 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
            <UserPlus size={40} className="mb-4 opacity-30" />
            <p className="font-medium text-sm">배정된 학생이 없습니다.</p>
            <p className="text-xs mt-1">우측 상단 버튼을 눌러보세요.</p>
          </div>
        )}
      </div>

      {/* 모달 UI (반응형: 작은 화면에선 전체 화면 느낌) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col max-h-[85vh] animate-pop-in">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">원생 데려오기</h2>
                <div className="text-xs md:text-sm text-gray-500 mt-1 flex items-center">
                    {targetGrade ? <span className="bg-blue-50 text-blue-600 px-1.5 rounded font-bold mr-1">{targetGrade}</span> : ''}
                    우선 정렬됨
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 custom-scrollbar">
              {availableStudents.length > 0 ? availableStudents.map((s) => {
                const isSelected = selectedStudentIds.includes(s.id);
                const isRecommended = s.grade === targetGrade;
                
                return (
                  <div 
                    key={s.id} onClick={() => toggleSelect(s.id)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-full ${s.avatar_color} flex items-center justify-center font-bold text-sm mr-3`}>{s.name[0]}</div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm flex items-center">
                            {s.name}
                            {isRecommended && <span className="ml-2 text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold border border-yellow-200">추천</span>}
                        </div>
                        <div className="text-xs text-gray-500">{s.grade}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {isSelected && <CheckCircle size={12} className="text-white" />}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-10 text-gray-400">
                    <p className="text-sm">가능한 학생이 없습니다.</p>
                </div>
              )}
            </div>
            
            <button onClick={handleAddStudentsToClass} disabled={selectedStudentIds.length === 0} className={`w-full py-3.5 rounded-xl font-bold text-base shadow-lg shrink-0 transition-all ${selectedStudentIds.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {selectedStudentIds.length}명 배정하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}