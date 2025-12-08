import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogOut, ChevronRight, School, Calendar, TrendingUp, MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // 데이터 상태
  const [myChildren, setMyChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ avgScore: 0, attendance: 0 });

  // 모달 상태
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // [최적화] 데이터 로딩 (통합 API)
  const loadData = async (childId?: string) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
        let url = `/api/parent?parent_id=${user.id}`;
        if (childId) url += `&child_id=${childId}`;

        const res = await fetch(url);
        const data = await res.json();

        setMyChildren(data.children || []);
        
        // 자녀가 있거나 선택된 경우 데이터 세팅
        if (data.children.length > 0) {
            // childId가 지정되었거나, 자녀가 1명뿐인 경우 자동 선택
            const targetChild = childId 
                ? data.children.find((c: any) => c.id == childId) 
                : (data.children.length === 1 ? data.children[0] : null);

            if (targetChild) {
                setSelectedChild(targetChild);
                setLogs(data.logs || []);
                setStats(data.stats || { avgScore: 0, attendance: 0 });
            }
        }
    } catch (e) {
        console.error("데이터 로드 실패", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectChild = (child: any) => {
    setSelectedChild(child); // UI 즉시 반영을 위해 세팅
    loadData(child.id); // 데이터 갱신 요청
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // 상세 모달 열기
  const openDetail = (log: any) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  if (loading && myChildren.length === 0) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">리포트 불러오는 중...</div>;

  // [화면 1] 학원 선택 (자녀가 여러 명이고, 아직 선택 안 했을 때)
  if (!selectedChild && myChildren.length > 0) {
    return (
        <div className="min-h-screen bg-[#F5F7FA] p-6 flex flex-col">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">학원 선택</h1>
                    <p className="text-gray-500">확인하실 자녀(학원)를 선택해주세요.</p>
                </div>
                <button onClick={handleLogout} className="p-2 bg-gray-200 rounded-full"><LogOut size={18}/></button>
            </header>
            <div className="space-y-4">
                {myChildren.map(child => (
                    <div key={child.id} onClick={() => handleSelectChild(child)}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
                        <div className="flex items-center">
                            <div className={`w-12 h-12 rounded-full ${child.avatar_color} flex items-center justify-center font-bold text-lg mr-4`}>{child.name[0]}</div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{child.name}</h3>
                                <p className="text-sm text-gray-500">{child.classes?.name || '정보 없음'}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300" />
                    </div>
                ))}
            </div>
        </div>
    );
  }

  // 자녀 없음
  if (myChildren.length === 0 && !loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <School size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900">등록된 정보가 없습니다.</h2>
            <p className="text-gray-500 mt-2 mb-6 text-sm">학원에 등록하신 학부모 전화번호와<br/>가입하신 번호가 일치하는지 확인해주세요.</p>
            <button onClick={handleLogout} className="text-blue-600 font-bold underline">로그아웃</button>
        </div>
    );
  }

  // [화면 2] 메인 대시보드
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20 animate-fade-in">
      {/* 헤더 */}
      <header className="bg-white p-5 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center">
            <div className="flex items-center cursor-pointer" onClick={() => myChildren.length > 1 && setSelectedChild(null)}>
                {myChildren.length > 1 && <ChevronRight className="rotate-180 mr-2 text-gray-400" />}
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center">
                        {selectedChild?.name} <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">학생</span>
                    </h1>
                    <p className="text-xs text-gray-500">{selectedChild?.classes?.name} | {selectedChild?.classes?.schedule}</p>
                </div>
            </div>
            <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-full text-gray-500"><LogOut size={18}/></button>
        </div>
      </header>

      <div className="p-5 space-y-6">
        
        {/* 1. 최신 리포트 */}
        <section>
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 text-lg flex items-center"><Calendar size={18} className="mr-2 text-blue-600"/> 최근 수업</h2>
            </div>
            
            {logs.length > 0 ? (
                <div onClick={() => openDetail(logs[0])} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-all">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">New</div>
                    <p className="text-sm text-gray-400 mb-1">{new Date(logs[0].created_at).toLocaleDateString()}</p>
                    <div className="flex items-end mb-4">
                        <span className="text-4xl font-extrabold text-gray-900 mr-2">{logs[0].score}</span>
                        <span className="text-sm text-gray-500 mb-1">/ 100점</span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-start">
                            <MessageCircle size={16} className="text-blue-500 mr-2 mt-0.5 shrink-0" />
                            <p className="text-sm text-gray-700 line-clamp-2">{logs[0].teacher_comment || "코멘트 없음"}</p>
                        </div>
                    </div>
                    <div className="mt-3 text-center text-xs text-blue-500 font-bold">터치하여 상세 보기</div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-2xl text-center text-gray-400 border border-gray-200">아직 수업 기록이 없습니다.</div>
            )}
        </section>

        {/* 2. 월간 분석 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-6">
                <TrendingUp size={18} className="mr-2 text-green-600"/>
                <h2 className="font-bold text-gray-800 text-lg">이번 달 분석</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-xl text-center">
                    <p className="text-xs text-green-600 font-bold mb-1">평균 이해도</p>
                    <p className="text-2xl font-extrabold text-gray-800">{stats.avgScore}점</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                    <p className="text-xs text-purple-600 font-bold mb-1">수업 참여</p>
                    <p className="text-2xl font-extrabold text-gray-800">{stats.attendance}회</p>
                </div>
            </div>
        </section>

        {/* 3. 상담 신청 */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
            <div>
                <h3 className="font-bold text-lg">상담이 필요하신가요?</h3>
                <p className="text-xs text-gray-300 mt-1">원장님께 알림을 보냅니다.</p>
            </div>
            <button onClick={() => alert("신청되었습니다.")} className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100">신청</button>
        </section>
      </div>

      {/* 상세 모달 (디자인 유지) */}
      {isDetailOpen && selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-pop-in relative">
            <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{new Date(selectedLog.created_at).toLocaleDateString()}</h2>
            <p className="text-sm text-gray-500 mb-6">상세 학습 리포트</p>
            <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                    <span className="font-bold text-blue-800">이해도</span><span className="text-2xl font-extrabold text-blue-600">{selectedLog.score}점</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl text-center"><p className="text-xs text-gray-500 mb-2">숙제</p><div className="font-bold text-lg">{selectedLog.homework === 'done' ? '완료 ⭕' : selectedLog.homework === 'incomplete' ? '미흡 ⚠️' : '-'}</div></div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center"><p className="text-xs text-gray-500 mb-2">태도</p><div className="font-bold text-lg">{selectedLog.attitude === 'high' ? '최고 👍' : selectedLog.attitude === 'middle' ? '보통 👌' : '아쉬움'}</div></div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2 font-bold">선생님 한마디</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{selectedLog.teacher_comment || "없음"}</p>
                </div>
            </div>
            <button onClick={() => setIsDetailOpen(false)} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}