import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Plus, X, Save, Trash2, BookOpen, Activity, Users, ClipboardCheck, AlertTriangle } from 'lucide-react';

type TimeSlot = { day: string; ampm: string; hour: string; minute: string; };

export default function ClassList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  
  // [NEW] 대시보드 데이터 상태
  const [stats, setStats] = useState({
    today_classes: 0,
    total_students: 0,
    today_evals: 0,
    risk_students: [] as any[]
  });

  // 모달 및 입력 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [schedules, setSchedules] = useState<TimeSlot[]>([{ day: '월요일', ampm: '오후', hour: '07', minute: '00' }]);
  const [targetSchool, setTargetSchool] = useState('중');
  const [targetGrade, setTargetGrade] = useState('1');

  // 데이터 로딩 (병렬 처리)
  const fetchAllData = async () => {
    try {
        const [classRes, statRes] = await Promise.all([
            fetch('/api/classes'),
            fetch('/api/dashboard') // 대시보드 API 호출
        ]);
        
        const classData = await classRes.json();
        const statData = await statRes.json();

        setClasses(classData || []);
        setStats(statData || { today_classes: 0, total_students: 0, today_evals: 0, risk_students: [] });
    } catch (error) {
        console.error("데이터 로딩 실패", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 수업 추가 로직 (기존과 동일)
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    const finalSchedule = schedules.map(s => `${s.day} ${s.ampm} ${s.hour}:${s.minute}`).join(' / ');
    const finalTargetGrade = `${targetSchool}${targetGrade}`;

    try {
      await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, schedule: finalSchedule, target_grade: finalTargetGrade })
      });
      alert("수업이 개설되었습니다!");
      setIsModalOpen(false);
      setNewClassName('');
      setSchedules([{ day: '월요일', ampm: '오후', hour: '07', minute: '00' }]);
      fetchAllData(); 
    } catch (error) { alert("개설 실패!"); }
  };

  // UI 헬퍼 함수들
  const addScheduleSlot = () => setSchedules([...schedules, { day: '월요일', ampm: '오후', hour: '07', minute: '00' }]);
  const removeScheduleSlot = (index: number) => { if(schedules.length > 1) setSchedules(schedules.filter((_, i) => i !== index)); };
  const updateSchedule = (index: number, field: keyof TimeSlot, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  if (loading) return <div className="text-gray-400 py-20 text-center animate-pulse">학원 현황을 분석 중입니다...</div>;

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      
      {/* 1. [NEW] 상단 대시보드 (통계 카드) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 오늘 수업 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-50 p-2 rounded-full mb-2 text-blue-600"><Activity size={20}/></div>
            <p className="text-xs text-gray-500 font-bold">오늘 수업</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.today_classes}개</p>
        </div>
        {/* 전체 원생 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-purple-50 p-2 rounded-full mb-2 text-purple-600"><Users size={20}/></div>
            <p className="text-xs text-gray-500 font-bold">전체 원생</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.total_students}명</p>
        </div>
        {/* 오늘 평가 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-green-50 p-2 rounded-full mb-2 text-green-600"><ClipboardCheck size={20}/></div>
            <p className="text-xs text-gray-500 font-bold">오늘 평가완료</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.today_evals}건</p>
        </div>
        {/* 집중 케어 (위험군) - 빨간색 강조 */}
        <div className="bg-red-50 p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-red-100 transition-colors"
             onClick={() => stats.risk_students.length > 0 && alert("집중 케어 명단:\n" + stats.risk_students.map((s:any) => `${s.name}(${s.avg}점)`).join(', '))}>
            <div className="bg-white p-2 rounded-full mb-2 text-red-500"><AlertTriangle size={20}/></div>
            <p className="text-xs text-red-600 font-bold">집중 케어</p>
            <p className="text-2xl font-extrabold text-red-600">{stats.risk_students.length}명</p>
        </div>
      </section>

      {/* 2. 수업 목록 섹션 */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">내 수업 목록</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg">
            <Plus size={18} className="mr-2" /> 수업 개설
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls, index) => (
                <div key={cls.id} onClick={() => navigate(`/class/${cls.id}`)}
                className={`group bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[12rem] ${index === 0 ? 'border-blue-200 ring-2 ring-blue-50' : 'border-gray-100'}`}>
                {index === 0 && <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg z-20">SOON</div>}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                
                <div className="relative z-10 w-full">
                    <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">{cls.target_grade || '전체'}</span>
                    <ArrowRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={20}/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1">{cls.name}</h3>
                </div>
                <div className="relative z-10 space-y-1 mt-2">
                    {cls.schedule.split(' / ').map((sch: string, idx: number) => (
                        <div key={idx} className="flex items-center text-gray-600 text-sm bg-gray-50 p-2 rounded-lg w-fit font-medium">
                            <Clock size={14} className="mr-1.5 text-gray-400" /><span>{sch}</span>
                        </div>
                    ))}
                </div>
                </div>
            ))}
            {classes.length === 0 && (
                <div onClick={() => setIsModalOpen(true)} className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 cursor-pointer h-48 bg-gray-50/50 hover:bg-gray-100 transition-colors">
                <Plus size={24} className="mb-2"/> <span className="font-bold">수업 개설하기</span>
                </div>
            )}
        </div>
      </section>

      {/* 모달 UI (기존과 동일하므로 생략 - 위 코드에는 포함되어야 함) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm md:max-w-md rounded-3xl p-6 md:p-8 shadow-2xl scale-100 animate-pop-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">새 수업 개설</h2>
            <form onSubmit={handleAddClass} className="space-y-5">
              {/* (입력 폼 내용은 이전과 동일) */}
              <div><label className="block text-sm font-bold text-gray-700 mb-1">수업명</label><div className="relative"><BookOpen className="absolute left-4 top-3.5 text-gray-400" size={18} /><input type="text" required placeholder="예: 고1 수학 심화반" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium" /></div></div>
              <div>
                <div className="flex justify-between items-center mb-2"><label className="block text-sm font-bold text-gray-700">수업 시간표</label><button type="button" onClick={addScheduleSlot} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md text-gray-600 font-bold flex items-center"><Plus size={12} className="mr-1"/> 시간 추가</button></div>
                <div className="space-y-2">{schedules.map((sch, idx) => (<div key={idx} className="flex gap-1 items-center bg-gray-50 p-2 rounded-xl border border-gray-200 overflow-x-auto"><select value={sch.day} onChange={(e) => updateSchedule(idx, 'day', e.target.value)} className="bg-transparent font-bold text-sm outline-none min-w-[60px]">{['월요일','화요일','수요일','목요일','금요일','토요일','일요일'].map(d => <option key={d} value={d}>{d}</option>)}</select><select value={sch.ampm} onChange={(e) => updateSchedule(idx, 'ampm', e.target.value)} className="bg-transparent font-bold text-sm outline-none"><option value="오전">오전</option><option value="오후">오후</option></select><select value={sch.hour} onChange={(e) => updateSchedule(idx, 'hour', e.target.value)} className="bg-transparent font-bold text-sm outline-none">{Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}</select><span>:</span><select value={sch.minute} onChange={(e) => updateSchedule(idx, 'minute', e.target.value)} className="bg-transparent font-bold text-sm outline-none">{['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}</select>{schedules.length > 1 && <button type="button" onClick={() => removeScheduleSlot(idx)} className="ml-auto text-red-400 hover:text-red-600"><Trash2 size={16} /></button>}</div>))}</div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">대상 학년</label><div className="flex gap-2"><select value={targetSchool} onChange={(e) => setTargetSchool(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center outline-none appearance-none"><option value="초">초등</option><option value="중">중등</option><option value="고">고등</option></select><select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center outline-none appearance-none">{[1,2,3].map(n => <option key={n} value={n}>{n}학년</option>)}</select></div></div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4 flex items-center justify-center"><Save size={18} className="mr-2" /> 개설하기</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}