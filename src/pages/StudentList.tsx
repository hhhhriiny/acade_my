import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ChevronLeft, User } from 'lucide-react';

export default function StudentList() {
  const { classId } = useParams(); // URL에서 반 ID 가져오기
  const [students, setStudents] = useState<any[]>([]);
  const [className, setClassName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 1. 반 이름 가져오기
    supabase.from('classes').select('name').eq('id', classId).single()
      .then(({ data }) => setClassName(data?.name));

    // 2. 이 반에 속한 학생들만 가져오기
    supabase.from('students').select('*').eq('class_id', classId)
      .then(({ data }) => setStudents(data || []));
  }, [classId]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <header className="bg-white p-4 border-b border-gray-200 sticky top-0 flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 mr-2"><ChevronLeft /></button>
        <h1 className="text-lg font-bold">{className}</h1>
      </header>
      
      <div className="p-6 grid grid-cols-2 gap-4">
        {students.map((student) => (
          <div 
            key={student.id}
            onClick={() => navigate(`/evaluation/${student.id}`)} // 클릭 시 평가 화면으로
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center aspect-square active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className={`w-16 h-16 rounded-full ${student.avatar_color || 'bg-gray-100'} flex items-center justify-center text-2xl font-bold mb-3`}>
              {student.name[0]}
            </div>
            <span className="font-bold text-gray-900">{student.name}</span>
            <span className="text-xs text-gray-400 mt-1">평가 대기중</span>
          </div>
        ))}
      </div>
    </div>
  );
}