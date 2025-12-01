import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'; // ✅ 引入 useLocation
import { Layout, Switch, Typography} from 'antd';
import type { UserRole } from './types';
import ApprovalList from './ApprovalList/ApprovalList';
import ApprovalForm from './ApprovalForm/ApprovalForm';

const { Header, Content } = Layout;

// 布局组件
const MainLayout: React.FC<{ children: React.ReactNode, role: UserRole, setRole: (r: UserRole) => void }> = ({ children, role, setRole }) => {
  const location = useLocation();
  const isFormPage = location.pathname.includes('/create') || location.pathname.includes('/edit');

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
         <Typography.Title level={4} style={{ margin: 0 }}>企业审批系统</Typography.Title>
         {!isFormPage && (
           <div>
             <span style={{ marginRight: 12 }}>当前角色</span>
             <Switch 
                checkedChildren="审批员" 
                unCheckedChildren="申请人"
                checked={role === 'approver'}
                onChange={(v) => setRole(v ? 'approver' : 'applicant')}
              />
           </div>
         )}
      </Header>
      <Content>
        {children}
      </Content>
    </Layout>
  )
}

const App: React.FC = () => {
  // 只需要保留角色状态
  const [role, setRole] = useState<UserRole>('applicant');

  return (
    <BrowserRouter>
      <MainLayout role={role} setRole={setRole}>
        <Routes>
          <Route path="/" element={<ApprovalList role={role} />} />
          <Route path="/create" element={<ApprovalForm />} />
          <Route path="/edit/:id" element={<ApprovalForm />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;