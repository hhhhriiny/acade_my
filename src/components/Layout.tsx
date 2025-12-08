import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Menu, Bell, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getTitle = () => {
    if (location.pathname.includes('/class/')) return '학생 목록';
    if (location.pathname.includes('/evaluation/')) return '수업 평가';
    if (location.pathname === '/students') return '원생 관리';
    return '수업 관리';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    // [수정] h-screen과 overflow-hidden을 주어 전체 스크롤을 방지하고 내부 스크롤 유도
    <div className="h-screen bg-[#F5F7FA] flex font-sans text-gray-900 overflow-hidden">
      
      {/* 1. [PC 사이드바] */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 z-30">
        <div className="p-6 border-b border-gray-100 flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">A</div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">ACADE : MY</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLinks navigate={navigate} location={location} />
        </nav>
        <div className="p-4 border-t border-gray-100">
           <LogoutButton onClick={handleLogout} />
        </div>
      </aside>

      {/* 2. [모바일 메뉴] */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={toggleMobileMenu}>
            <div className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-gray-900">메뉴</h2>
                    <button onClick={toggleMobileMenu} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                <nav className="flex-1 space-y-2">
                    <NavLinks navigate={navigate} location={location} onClick={toggleMobileMenu} />
                </nav>
                <div className="mt-auto">
                    <LogoutButton onClick={handleLogout} />
                </div>
            </div>
        </div>
      )}

      {/* 3. [메인 영역] */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        
        {/* 헤더 */}
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shrink-0">
          <div className="flex items-center flex-1 min-w-0">
            <button className="md:hidden mr-3 text-gray-500 p-2 hover:bg-gray-100 rounded-full" onClick={toggleMobileMenu}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-800 truncate">{getTitle()}</h2>
          </div>
          
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 border border-white shadow-sm"></div>
          </div>
        </header>

        {/* [수정] 컨텐츠 영역: max-w 제거하고 w-full 적용. 스크롤은 여기서만 발생 */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
          <div className="w-full h-full pb-20"> {/* Bottom Padding 추가 */}
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}

// (하단 컴포넌트는 기존과 동일)
function NavLinks({ navigate, location, onClick }: any) {
    const handleClick = (path: string) => { navigate(path); if (onClick) onClick(); };
    return (
        <>
            <NavItem icon={<LayoutDashboard size={20} />} label="수업 목록" active={location.pathname === '/' || location.pathname.includes('/class')} onClick={() => handleClick('/')} />
            <NavItem icon={<Users size={20} />} label="원생 관리" active={location.pathname === '/students'} onClick={() => handleClick('/students')} />
            <NavItem icon={<Settings size={20} />} label="설정" active={false} />
        </>
    )
}
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all ${active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
      {icon} <span>{label}</span>
    </div>
  );
}
function LogoutButton({ onClick }: any) {
    return (
        <button onClick={onClick} className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-red-500 w-full transition-colors">
            <LogOut size={20} /> <span className="font-medium">로그아웃</span>
        </button>
    )
}