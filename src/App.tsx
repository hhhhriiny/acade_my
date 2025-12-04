import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 컴포넌트들 불러오기 (경로가 정확해야 합니다!)
import Layout from './components/Layout'; 
import ClassList from './pages/ClassList';
import StudentList from './pages/StudentList';
import Evaluation from './pages/Evaluation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout 컴포넌트로 감싸기 */}
        <Route element={<Layout />}>
          
          {/* 메인 화면 (반 목록) */}
          <Route path="/" element={<ClassList />} />
          
          {/* 학생 목록 화면 */}
          <Route path="/class/:classId" element={<StudentList />} />
          
          {/* 평가 화면 */}
          <Route path="/evaluation/:studentId" element={<Evaluation />} />
          
        </Route>

        {/* 이상한 주소로 가면 메인으로 튕겨내기 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}