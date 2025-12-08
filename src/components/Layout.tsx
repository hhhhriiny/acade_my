import React, { useState } from 'react'; // useState 추가
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Menu, Bell, X } from 'lucide-react'; // X 아이콘 추가
import { supabase } from '../supabaseClient';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 모바일 메뉴 상태

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
    <div className="min-h-screen bg-[#F5F7FA] flex font-sans text-gray-900">
      
      {/* 1. [PC용 사이드바] md 이상일 때만 보임 (hidden md:flex) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen z-30">
        <div className="p-6 border-b border-gray-100 flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">A</div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">ACADE : MY</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLinks navigate={navigate} location={location} />
        </nav>
        <div className="p-4 border-t border-gray-100">
           <LogoutButton onClick={handleLogout} />
        </div>
      </aside>

      {/* 2. [모바일용 메뉴 오버레이] */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={toggleMobileMenu}>
            <div className="absolute left-0 top-0 h-full w-64 bg-white p-4 shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-gray-900">메뉴</h2>
                    <button onClick={toggleMobileMenu}><X /></button>
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
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 헤더 */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
          <div className="flex items-center">
            {/* 햄버거 버튼 (모바일만 보임: md:hidden) */}
            <button className="md:hidden mr-4 text-gray-500" onClick={toggleMobileMenu}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-800 truncate max-w-[200px]">{getTitle()}</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 border border-white shadow-sm"></div>
          </div>
        </header>

        {/* 컨텐츠 (모바일에서는 패딩을 줄이고, PC에서는 넓게) */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}

// [부품] 네비게이션 링크들
function NavLinks({ navigate, location, onClick }: any) {
    const handleClick = (path: string) => {
        navigate(path);
        if (onClick) onClick(); // 모바일 메뉴 닫기
    };
    return (
        <>
            <NavItem icon={<LayoutDashboard size={20} />} label="수업 목록" active={location.pathname === '/' || location.pathname.includes('/class')} onClick={() => handleClick('/')} />
            <NavItem icon={<Users size={20} />} label="원생 관리" active={location.pathname === '/students'} onClick={() => handleClick('/students')} />
            <NavItem icon={<Settings size={20} />} label="설정" active={false} />
        </>
    )
}

// [부품] 메뉴 아이템
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all ${active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
      {icon} <span>{label}</span>
    </div>
  );
}

// [부품] 로그아웃 버튼
function LogoutButton({ onClick }: any) {
    return (
        <button onClick={onClick} className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-red-500 w-full transition-colors">
            <LogOut size={20} /> <span className="font-medium">로그아웃</span>
        </button>
    )
}