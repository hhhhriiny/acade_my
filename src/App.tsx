import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// --- 페이지 컴포넌트 불러오기 ---
import Login from './pages/Login';
import Layout from './components/Layout'; // 원장님용 레이아웃 (사이드바)
import ClassList from './pages/ClassList'; // 원장님 메인 (수업 목록)
import StudentList from './pages/StudentList'; // 반별 학생 관리
import Evaluation from './pages/Evaluation'; // 평가 페이지
import StudentMaster from './pages/StudentMaster'; // 전체 원생 관리
import ParentDashboard from './pages/ParentDashboard'; // 학부모 메인

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. 로그인/로그아웃 상태 실시간 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 로딩 중에는 하얀 화면 (깜빡임 방지)
  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. 로그인 페이지 (로그인 되어 있으면 홈으로 튕김) */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

        {/* 2. 학부모용 대시보드 (레이아웃 없이 단독 페이지) */}
        <Route path="/report" element={session ? <ParentDashboard /> : <Navigate to="/login" />} />

        {/* 3. 원장님용 페이지들 (Layout으로 감싸서 사이드바 표시) */}
        <Route element={session ? <Layout /> : <Navigate to="/login" />}>
          
          {/* 메인: 수업 목록 */}
          <Route path="/" element={<ClassList />} />
          
          {/* 원생 관리 (전체 목록) */}
          <Route path="/students" element={<StudentMaster />} />
          
          {/* 반별 학생 목록 (:classId는 변수) */}
          <Route path="/class/:classId" element={<StudentList />} />
          
          {/* 평가 화면 (:studentId는 변수) */}
          <Route path="/evaluation/:studentId" element={<Evaluation />} />
          
        </Route>

        {/* 4. 이상한 주소로 들어오면 홈으로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" />} />
        
      </Routes>
    </BrowserRouter>
  );
}