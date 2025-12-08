import React, { useEffect, useState } from 'react';
import { Search, Plus, Phone, School, X, Save } from 'lucide-react';

export default function StudentMaster() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 입력 폼
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [schoolType, setSchoolType] = useState('중');
  const [gradeNum, setGradeNum] = useState('1');

  // [최적화 1] 검색 기능이 포함된 API 호출
  const fetchStudents = async (query = '') => {
    setLoading(true);
    try {
        const res = await fetch(`/api/master_students?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setStudents(data || []);
    } catch (e) {
        console.error("데이터 로딩 실패");
    } finally {
        setLoading(false);
    }
  };

  // 초기 로딩
  useEffect(() => {
    fetchStudents();
  }, []);

  // [최적화] 검색어 입력 시 API 재호출 (엔터 칠 때 or 버튼 누를 때)
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      fetchStudents(searchTerm);
  };

  // [최적화 2] 학생 등록 API 호출
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-yellow-100 text-yellow-600'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const res = await fetch('/api/master_students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, school_name: schoolName, phone_number: phoneNumber, parent_phone_1: parentPhone,
            school_type: schoolType, grade_num: gradeNum, // 분리된 데이터 전송
            avatar_color: randomColor
          })
      });

      if (!res.ok) throw new Error('저장 실패');

      alert("원생이 등록되었습니다.");
      setIsModalOpen(false);
      
      // 초기화
      setName(''); setSchoolName(''); setPhoneNumber(''); setParentPhone('');
      setSchoolType('중'); setGradeNum('1');
      
      fetchStudents(); // 목록 갱신

    } catch (error) {
      alert("등록 실패! 정보를 확인해주세요.");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 상단 헤더 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">전체 원생 관리</h2>
           <p className="text-gray-500 mt-1">학원의 모든 학생 정보를 관리합니다.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} className="mr-2" /> 신규 원생 등록
        </button>
      </div>

      {/* 검색창 (API 연동) */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="이름 또는 전화번호로 검색 (엔터)" 
          className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg font-bold text-gray-600 hover:bg-gray-200">검색</button>
      </form>

      {/* 리스트 (반응형 테이블) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-10 text-center text-gray-400">데이터 불러오는 중...</div>
        ) : (
            <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium text-sm border-b border-gray-100">
                <tr>
                <th className="p-4 pl-6">이름/학교</th>
                <th className="p-4 hidden md:table-cell">연락처</th>
                <th className="p-4 hidden lg:table-cell">부모님 연락처</th>
                <th className="p-4 text-center">학년</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 pl-6">
                        <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full ${s.avatar_color || 'bg-gray-100'} flex items-center justify-center font-bold mr-3 text-sm shrink-0`}>
                                {s.name[0]}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{s.name}</div>
                                <div className="text-xs text-gray-400 flex items-center mt-0.5">
                                <School size={10} className="mr-1"/> {s.school_name || '미입력'}
                                </div>
                                {/* 모바일에서만 보이는 연락처 정보 */}
                                <div className="md:hidden text-[10px] text-gray-400 mt-1">
                                    📞 {s.parent_phone_1 || '-'}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className="p-4 text-gray-600 text-sm hidden md:table-cell">{s.phone_number || '-'}</td>
                    <td className="p-4 text-gray-600 text-sm hidden lg:table-cell">
                        <div className="flex items-center">
                            <Phone size={14} className="mr-1 text-gray-400"/>
                            {s.parent_phone_1 || '-'}
                        </div>
                    </td>
                    <td className="p-4 text-center">
                        <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold min-w-[3rem]">{s.grade}</span>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        {!loading && students.length === 0 && <div className="p-10 text-center text-gray-400">검색 결과가 없습니다.</div>}
      </div>

      {/* 모달 UI (이전과 동일하지만 API 연동됨) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl animate-pop-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} className="text-gray-600"/></button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">신규 원생 등록</h2>
            
            <form onSubmit={handleAddStudent} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
                <input type="text" required className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-medium"
                  value={name} onChange={e => setName(e.target.value)} placeholder="예: 홍길동" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">학년 정보</label>
                <div className="flex gap-3">
                    <select value={schoolType} onChange={(e) => {setSchoolType(e.target.value); setGradeNum('1');}} className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center outline-none appearance-none"><option value="초">초등학교</option><option value="중">중학교</option><option value="고">고등학교</option></select>
                    <select value={gradeNum} onChange={(e) => setGradeNum(e.target.value)} className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center outline-none appearance-none">{[1,2,3].map(n => <option key={n} value={n}>{n}학년</option>)}{schoolType === '초' && [4,5,6].map(n => <option key={n} value={n}>{n}학년</option>)}</select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">학교명</label>
                <input type="text" className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500" value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="예: 창원중학교" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">학생 폰번호</label>
                  <input type="tel" className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="010-0000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-700 mb-1">학부모 폰번호 (필수)</label>
                  <input type="tel" required className="w-full p-3.5 bg-blue-50 rounded-xl border border-blue-200 outline-none focus:border-blue-500" value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="매칭 키로 사용됨" />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 flex justify-center items-center shadow-md hover:bg-blue-700 transition-all">
                <Save size={20} className="mr-2"/> 등록 완료
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}