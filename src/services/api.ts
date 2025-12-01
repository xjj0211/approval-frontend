import axios from 'axios';
import type{ ApprovalItem } from '../types';

// 配置后端地址
const api = axios.create({
  //baseURL: 'http://localhost:3000/api',
  baseURL: 'https://approval-backend-ab8i.onrender.com/api',
});

export const approvalApi = {
  // 获取列表
  getList: (params?: any) => api.get<{ data: ApprovalItem[], total: number }>('/approvals', { params }),
  
  // 获取详情
  getDetail: (id: string) => api.get<ApprovalItem>(`/approvals/${id}`),
  
  // 新建
  create: (data: Partial<ApprovalItem>) => api.post('/approvals', data),
  
  // 修改
  update: (id: string, data: Partial<ApprovalItem>) => api.patch(`/approvals/${id}`, data),
  
  // 撤回
  withdraw: (id: string) => api.post(`/approvals/${id}/withdraw`),
  
  // 通过
  pass: (id: string) => api.post(`/approvals/${id}/pass`),
  
  // 驳回
  reject: (id: string) => api.post(`/approvals/${id}/reject`),

  // 获取表单 schema
  getSchema: () => api.get('/approvals/schema'),
};