import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone, ArrowRight, CheckCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'owner' | 'parent'>('owner');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // [회원가입]
        // 1. Supabase Auth (기본 계정 생성)
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
          // 2. [Python API 호출] 뒷정리(역할 부여 + 매칭) 위임
          const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: data.user.id, 
                role, 
                phone 
            })
          });
          
          const result = await res.json();
          let msg = "가입이 완료되었습니다!";
          if (result.matched > 0) msg += `\n자녀 ${result.matched}명과 연결되었습니다.`;
          
          alert(msg);
        }
      } else {
        // [로그인]
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      // 페이지 이동 로직
      checkUserRoleAndRedirect();

    } catch (error: any) {
      alert("오류 발생: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkUserRoleAndRedirect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('id', user.id).single();
      if (roleData?.role === 'parent') navigate('/report');
      else navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* 카드 컨테이너 (반응형: 모바일 w-full, PC max-w-md) */}
      <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-[2rem] shadow-2xl border border-white/50 relative overflow-hidden">
        
        {/* 배경 데코레이션 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-10 -mt-10 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full -ml-10 -mb-10 blur-3xl opacity-50"></div>

        <div className="relative z-10">
            <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-4 shadow-lg shadow-blue-500/30 transform rotate-3">A</div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ACADE : MY</h1>
            <p className="text-gray-500 mt-2 font-medium">{isSignUp ? '학부모님과 원장님을 위한 시작' : '스마트한 학원 관리의 시작'}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
            
            {/* 이메일 */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">이메일</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                    type="email" placeholder="email@example.com" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    />
                </div>
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">비밀번호</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                    type="password" placeholder="••••••••" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    />
                </div>
            </div>

            {/* [회원가입 전용 필드] */}
            {isSignUp && (
                <div className="space-y-5 animate-fade-in-up">
                    {/* 역할 선택 */}
                    <div className="p-1 bg-gray-100 rounded-xl flex">
                        <button type="button" onClick={() => setRole('owner')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${role === 'owner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                            {role === 'owner' && <CheckCircle size={14} className="mr-1"/>} 원장님
                        </button>
                        <button type="button" onClick={() => setRole('parent')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${role === 'parent' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>
                            {role === 'parent' && <CheckCircle size={14} className="mr-1"/>} 학부모님
                        </button>
                    </div>

                    {/* 전화번호 (학부모일 때만) */}
                    {role === 'parent' && (
                        <div className="relative animate-fade-in">
                            <label className="text-xs font-bold text-blue-600 ml-1 mb-1 block">핸드폰 번호 (자녀 연결용)</label>
                            <Phone className="absolute left-4 top-9 text-blue-500" size={20} />
                            <input 
                                type="tel" placeholder="010-0000-0000" required
                                value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-800"
                            />
                        </div>
                    )}
                </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center transform active:scale-[0.98]">
                {loading ? '잠시만요...' : (isSignUp ? '가입하고 시작하기' : '로그인')}
                {!loading && <ArrowRight size={20} className="ml-2" />}
            </button>
            </form>

            <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
                {isSignUp ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}
                <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-blue-600 font-bold hover:underline">
                {isSignUp ? '로그인하기' : '회원가입하기'}
                </button>
            </p>
            </div>
        </div>
      </div>
    </div>
  );
}