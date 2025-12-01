// src/types.ts

// 审批状态：待审批、审批通过、审批拒绝 
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// 用户角色：申请人、审批员 
export type UserRole = 'applicant' | 'approver';

// 审批单核心数据结构
export interface ApprovalItem {
  id: string;
  projectName: string; // 审批项目 
  content: string;     // 审批内容 
  department: string[]; // 申请部门 (级联数据) 
  executeDate: string; // 执行日期 
  status: ApprovalStatus;
  createTime: string;  // 创建时间 
  updateTime: string;  // 审批时间 
  images?: string[]; // 图片 Base64 数组
  attachments?: { name: string; url: string }[]; // 附件对象数组
}