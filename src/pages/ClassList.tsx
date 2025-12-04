import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Clock, ArrowRight } from 'lucide-react';

export default function ClassList() {
  const [classes, setClasses] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('classes').select('*').order('id')
      .then(({ data }) => setClasses(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">오늘의 수업</h2>
           <p className="text-gray-500 mt-1">평가를 진행할 반을 선택해주세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => (
          <div 
            key={cls.id}
            onClick={() => navigate(`/class/${cls.id}`)}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">수학</span>
                <ArrowRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={20}/>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h3>
              
              <div className="flex items-center text-gray-500 text-sm">
                <Clock size={16} className="mr-1.5" />
                <span>{cls.schedule}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}