import type { ApprovalItem } from './types'; // ✅ 修复点：使用 type 导入
import dayjs from 'dayjs';

// 部门级联数据
export const departmentOptions = [
  {
    value: 'tech',
    label: '技术部',
    children: [
      {
        value: 'fe',
        label: '前端组',
        children: [{ value: 'infra', label: '基建团队' }, { value: 'biz', label: '业务团队' }],
      },
      { value: 'be', label: '后端组' },
    ],
  },
  {
    value: 'hr',
    label: '人力资源部',
    children: [{ value: 'rec', label: '招聘组' }],
  },
];

// 初始模拟数据
export const initialData: ApprovalItem[] = [
  {
    id: '1',
    projectName: '采购高性能服务器',
    content: '用于部署新的AI大模型训练任务，需要A100显卡支持。',
    department: ['tech', 'fe', 'infra'],
    executeDate: '2025-11-20',
    status: 'pending', // 待审批
    createTime: '2025-11-18 10:00:00',
    updateTime: '--',
  },
  {
    id: '2',
    projectName: '年度团建申请',
    content: '申请部门年度团建经费，预计每人500元标准。',
    department: ['hr', 'rec'],
    executeDate: '2025-12-01',
    status: 'approved', // 已通过
    createTime: '2025-11-15 09:30:00',
    updateTime: '2025-11-16 14:00:00',
  },
];

export const formatDate = (date: any) => dayjs(date).format('YYYY-MM-DD HH:mm:ss');