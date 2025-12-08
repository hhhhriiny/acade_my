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

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // 데이터 불러오기 (기존 로직 유지)
  const fetchData = async () => {
    if (!classId) return;
    const { data: clsData } = await supabase.from('classes').select('*').eq('id', classId).single();
    if (clsData) {
        setClassName(clsData.name);
        setTargetGrade(clsData.target_grade || '');
    }

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

  const openImportModal = async () => {
    try {
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
      <header className="bg-white p-4 border-b border-gray-200 sticky top-0 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px]">{loading ? '로딩 중...' : className}</h1>
            <div className="flex items-center text-sm text-gray-500 space-x-2 mt-0.5">
                <span>총 {classStudents.length}명</span>
                {targetGrade && <span className="hidden md:inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold text-xs">대상: {targetGrade}</span>}
            </div>
          </div>
        </div>
        <button 
          onClick={openImportModal}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-blue-700 transition-colors shadow-lg whitespace-nowrap"
        >
          <UserPlus size={18} className="mr-2" /> <span className="hidden md:inline">원생 </span>배정
        </button>
      </header>
      
      {/* 학생 리스트 (디자인 대폭 수정) */}
      <div className="p-5 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {classStudents.map((student) => (
            <div 
                key={student.id}
                onClick={() => navigate(`/evaluation/${student.id}`)}
                className={`
                    group relative flex flex-col items-center justify-center p-6 rounded-3xl shadow-sm border transition-all cursor-pointer overflow-hidden
                    /* [핵심 수정] aspect-square 제거, min-h 추가로 공간 확보 */
                    min-h-[200px]
                    ${student.isCompleted 
                        ? 'bg-blue-50/80 border-blue-200' 
                        : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md hover:-translate-y-1'}
                `}
            >
                {/* 상태 뱃지 (우측 상단 고정) */}
                <div className={`
                    absolute top-4 right-4 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center shadow-sm
                    ${student.isCompleted 
                        ? 'bg-white text-blue-700 border border-blue-100' 
                        : 'bg-gray-100 text-gray-500'}
                `}>
                    {student.isCompleted ? (
                        <>완료 <CheckCircle size={12} className="ml-1 text-blue-600"/></>
                    ) : (
                        <>대기 <Clock size={12} className="ml-1"/></>
                    )}
                </div>

                {/* 아바타 (크기 키움) */}
                <div className={`
                    w-20 h-20 rounded-full ${student.avatar_color || 'bg-gray-100'} 
                    flex items-center justify-center text-3xl font-bold mb-4 shadow-inner relative
                `}>
                    {student.name[0]}
                    {student.isCompleted && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1.5 border-4 border-blue-50">
                            <CheckCircle size={16} />
                        </div>
                    )}
                </div>

                {/* 이름 및 정보 */}
                <div className="text-center w-full">
                    <h3 className={`text-lg font-extrabold mb-1 truncate px-2 ${student.isCompleted ? 'text-blue-900' : 'text-gray-900'}`}>
                        {student.name}
                    </h3>
                    
                    <div className="inline-flex items-center justify-center bg-white/60 px-3 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-100">
                        <GraduationCap size={12} className="mr-1.5 opacity-70"/> 
                        {student.grade}
                    </div>
                </div>
            </div>
            ))}

            {/* 빈 상태 안내 */}
            {classStudents.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <UserPlus size={32} className="text-gray-300" />
                </div>
                <p className="font-bold text-lg text-gray-600">배정된 학생이 없습니다</p>
                <p className="text-sm mt-1">우측 상단 '원생 배정' 버튼을 눌러보세요.</p>
            </div>
            )}
        </div>
      </div>

      {/* 모달 UI (동일) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] animate-pop-in">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">원생 데려오기</h2>
                <div className="text-sm text-gray-500 mt-1 flex items-center">
                    {targetGrade ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold mr-2 text-xs">{targetGrade}</span> : ''}
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
                  <div key={s.id} onClick={() => toggleSelect(s.id)} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full ${s.avatar_color} flex items-center justify-center font-bold text-sm mr-4 shadow-sm`}>{s.name[0]}</div>
                      <div>
                        <div className="font-bold text-gray-900 text-base flex items-center">{s.name} {isRecommended && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">추천</span>}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.grade}</div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {isSelected && <CheckCircle size={14} className="text-white" />}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-10 text-gray-400"><p className="text-sm">가능한 학생이 없습니다.</p></div>
              )}
            </div>
            
            <button onClick={handleAddStudentsToClass} disabled={selectedStudentIds.length === 0} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shrink-0 transition-all ${selectedStudentIds.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 transform active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {selectedStudentIds.length}명 배정하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}