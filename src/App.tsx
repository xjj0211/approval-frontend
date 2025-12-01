import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'; // ✅ 引入 useLocation
import { Layout, Switch, Typography, message } from 'antd';
import { initialData, formatDate } from './mock';
import type { ApprovalItem, UserRole } from './types';
import ApprovalList from './ApprovalList/ApprovalList';
import ApprovalForm from './ApprovalForm/ApprovalForm';

const { Header, Content } = Layout;

// ✅ 修改 MainLayout：增加路由判断逻辑
const MainLayout: React.FC<{ children: React.ReactNode, role: UserRole, setRole: (r: UserRole) => void }> = ({ children, role, setRole }) => {
  const location = useLocation();
  // 判断是否在新建或编辑页
  const isFormPage = location.pathname.includes('/create') || location.pathname.includes('/edit');

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>企业审批系统</Typography.Title>

        {/* ✅ 只有不在表单页时，才显示角色切换 */}
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
  const [data, setData] = useState<ApprovalItem[]>(initialData);
  const [role, setRole] = useState<UserRole>('applicant');

  const handleSave = (values: any, id?: string) => {
    const formattedDate = values.executeDate.format('YYYY-MM-DD');
    if (id) {
      setData(prev => prev.map(item => item.id === id ? { ...item, ...values, executeDate: formattedDate } : item));
      message.success('修改成功');
    } else {
      const newItem: ApprovalItem = {
        id: Date.now().toString(),
        ...values,
        executeDate: formattedDate,
        status: 'pending',
        createTime: formatDate(new Date()),
        updateTime: '--'
      };
      setData([newItem, ...data]);
      message.success('新建成功');
    }
  };

  const handleApprovalAction = (id: string, status: 'approved' | 'rejected') => {
    setData(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: status,
          updateTime: formatDate(new Date())
        };
      }
      return item;
    }));
    message.success(status === 'approved' ? '已通过审批' : '已拒绝审批');
  };

  return (
    <BrowserRouter>
      <MainLayout role={role} setRole={setRole}>
        <Routes>
          <Route
            path="/"
            element={<ApprovalList role={role} />}
          />
          <Route path="/create" element={<ApprovalForm />} />
          <Route path="/edit/:id" element={<ApprovalForm />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;