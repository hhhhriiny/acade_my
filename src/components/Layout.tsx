import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Menu, Bell } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 주소에 따라 헤더 제목 바꾸기
  const getTitle = () => {
    if (location.pathname.includes('/class/')) return '학생 목록';
    if (location.pathname.includes('/evaluation/')) return '수업 평가';
    return '수업 관리';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex font-sans text-gray-900">
      
      {/* 1. [사이드바] PC 버전 (왼쪽 고정 메뉴) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen z-30">
        <div className="p-6 border-b border-gray-100 flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">A</div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">ACADE : MY</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="수업 목록" 
            active={location.pathname === '/' || location.pathname.includes('/class')} 
            onClick={() => navigate('/')}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="원생 관리" 
            active={false} 
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="설정" 
            active={false} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
           <button className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-red-500 w-full transition-colors">
            <LogOut size={20} />
            <span className="font-medium">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 2. [메인 영역] */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 공통 헤더 */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center">
            {/* 모바일에서만 보이는 햄버거 메뉴 */}
            <button className="md:hidden mr-4 text-gray-500">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-800">{getTitle()}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 border border-white shadow-sm"></div>
          </div>
        </header>

        {/* 3. [컨텐츠] 여기에 각 페이지(Outlet)가 들어옵니다 */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}

// 메뉴 아이템 컴포넌트 (재사용)
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center space-x-3 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all
        ${active 
          ? 'bg-blue-50 text-blue-700 shadow-sm' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
      `}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}