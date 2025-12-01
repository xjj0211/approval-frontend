import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, DatePicker, Select, Card, Row, Col, Space,
  Tag, Cascader, Drawer, Descriptions, message
} from 'antd';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';

import type { ApprovalItem, UserRole, ApprovalStatus } from '../types';
import { departmentOptions } from '../mock';
import { approvalApi } from '../services/api';
import { DownloadOutlined } from '@ant-design/icons';
import { Image } from 'antd';

const { RangePicker } = DatePicker;

interface Props {
  role: UserRole;
}

const ApprovalList: React.FC<Props> = ({ role }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 基础数据状态
  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // ✅ 1. 补全所有的筛选 State
  const [searchText, setSearchText] = useState(''); // 项目名称
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined); // 状态
  const [deptFilter, setDeptFilter] = useState<string[]>([]); // 部门 (Cascader value 是数组)
  const [createTimeRange, setCreateTimeRange] = useState<any>([]); // 创建时间
  const [updateTimeRange, setUpdateTimeRange] = useState<any>([]); // 审批时间

  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentDetail, setCurrentDetail] = useState<ApprovalItem | null>(null);

  // ✅ 1. 定义一个辅助函数：翻译部门 (放在组件内部或外部都可以)
  const getDeptLabel = (values: string[]) => {
    if (!values || values.length === 0) return '--';
    const labels: string[] = [];

    // ✅ 关键修改：强制将 departmentOptions 断言为 any[]
    let currentOptions: any[] = departmentOptions;

    for (const val of values) {
      const found = currentOptions?.find((opt: any) => opt.value === val);
      if (found) {
        labels.push(found.label);
        // ✅ 这里的 found.children 如果没有，给个空数组防止报错
        currentOptions = found.children || [];
      }
    }
    return labels.join(' / ');
  };

  // ✅ 2. 修改 fetchList：发送 updateStartTime / updateEndTime
  const fetchList = async () => {
    setLoading(true);
    try {
      // 创建时间
      const startTime = createTimeRange?.[0] ? dayjs(createTimeRange[0]).format('YYYY-MM-DD HH:mm:ss') : undefined;
      const endTime = createTimeRange?.[1] ? dayjs(createTimeRange[1]).format('YYYY-MM-DD HH:mm:ss') : undefined;

      // 审批时间 (新增)
      const updateStartTime = updateTimeRange?.[0] ? dayjs(updateTimeRange[0]).format('YYYY-MM-DD HH:mm:ss') : undefined;
      const updateEndTime = updateTimeRange?.[1] ? dayjs(updateTimeRange[1]).format('YYYY-MM-DD HH:mm:ss') : undefined;

      const departmentId = deptFilter && deptFilter.length > 0 ? deptFilter[deptFilter.length - 1] : undefined;

      const res = await approvalApi.getList({
        current: pagination.current,
        pageSize: pagination.pageSize,
        projectName: searchText,
        status: statusFilter,
        department: departmentId,
        startTime,
        endTime,
        updateStartTime, // 传给后端
        updateEndTime,   // 传给后端
      });

      setData(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      console.error(error);
      message.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听分页变化自动刷新（筛选条件由“查询”按钮触发，不自动监听，防止输入时频繁请求）
  useEffect(() => {
    fetchList();
  }, [pagination.current, pagination.pageSize]);

  // ✅ 3. 查询按钮：手动触发 fetchList，并重置到第一页
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchList(); // 显式调用一次
  };

  // ✅ 4. 清空按钮：重置所有 state
  const handleReset = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setDeptFilter([]);
    setCreateTimeRange([]);
    setUpdateTimeRange([]);
    setPagination({ ...pagination, current: 1 });
    // 这里的 fetchList 会读取到旧 state，最好用 setTimeout 或者依懒性触发，
    // 但为了简单，建议用户清空后再点一次查询，或者利用 useEffect 监听状态变化。
    // 这里我们直接刷新页面最简单，或者手动调用：
    setTimeout(() => {
      // 重新触发一次无参查询
      approvalApi.getList({ current: 1, pageSize: 10 }).then(res => {
        setData(res.data.data);
        setTotal(res.data.total);
      });
    }, 0);
  };

  const handleOpenDetail = (record: ApprovalItem) => {
    setCurrentDetail(record);
    setDrawerOpen(true);
  };

  const handleDrawerAction = async (status: 'approved' | 'rejected') => {
    if (!currentDetail) return;
    try {
      if (status === 'approved') await approvalApi.pass(currentDetail.id);
      else await approvalApi.reject(currentDetail.id);
      message.success('操作成功');
      setDrawerOpen(false);
      fetchList();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
  };

  // 列定义 (保持不变，省略部分代码以节省篇幅)
  const columns: ColumnsType<ApprovalItem> = [
    {
      title: '审批状态',
      dataIndex: 'status',
      width: 120,
      render: (status: ApprovalStatus) => {
        const colorMap: any = { pending: 'orange', approved: 'green', rejected: 'red', withdrawn: 'default' };
        const textMap: any = { pending: '待审批', approved: '审批通过', rejected: '审批拒绝', withdrawn: '已撤回' };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    { title: '审批时间', dataIndex: 'updateTime', width: 180 },
    { title: '审批项目', dataIndex: 'projectName', ellipsis: true, width: 250 },
    {
      title: '申请部门',
      dataIndex: 'department',
      render: (deptValues: string[]) => {
        const getLabels = (values: string[], options: any[]) => {
          if (!values) return '--';
          const labels: string[] = [];
          let currentOptions = options;
          for (const val of values) {
            const found = currentOptions?.find((opt: any) => opt.value === val);
            if (found) {
              labels.push(found.label);
              currentOptions = found.children;
            }
          }
          return labels.join(' / ');
        };
        return getLabels(deptValues, departmentOptions);
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleOpenDetail(record)}>查看</Button>
          {role === 'applicant' && record.status === 'pending' && (
            <Button size="small" onClick={() => navigate(`/edit/${record.id}`)}>修改</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: 20 }}>审批查询页</div>

      <Card style={{ marginBottom: 20 }} styles={{ body: { padding: '24px' } }}>
        <div style={{ marginBottom: 16, fontWeight: 'bold' }}>筛选区</div>
        <Row gutter={[24, 16]}>
          <Col span={8}>
            <div>审批状态</div>
            <Select
              placeholder="请选择"
              style={{ width: '100%' }}
              allowClear
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
            >
              <Select.Option value="pending">待审批</Select.Option>
              <Select.Option value="approved">审批通过</Select.Option>
              <Select.Option value="rejected">审批拒绝</Select.Option>
            </Select>
          </Col>
          <Col span={8}>
            <div>创建时间</div>
            {/* ✅ 绑定 value 和 onChange */}
            <RangePicker
              style={{ width: '100%' }}
              value={createTimeRange}
              onChange={(dates) => setCreateTimeRange(dates)}
            />
          </Col>
          <Col span={8}>
            <div>审批时间</div>
            {/* ✅ 绑定 value 和 onChange */}
            <RangePicker
              style={{ width: '100%' }}
              value={updateTimeRange}
              onChange={(dates) => setUpdateTimeRange(dates)}
            />
          </Col>

          {!isCollapsed && (
            <>
              <Col span={8}>
                <div>审批项目</div>
                <Input
                  placeholder="请输入关键字"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
              <Col span={8}>
                <div>申请部门</div>
                {/* ✅ 绑定 value 和 onChange */}
                <Cascader
                  options={departmentOptions}
                  placeholder="请选择部门"
                  style={{ width: '100%' }}
                  value={deptFilter}
                  onChange={(val: any) => setDeptFilter(val)}
                  changeOnSelect
                />
              </Col>
              <Col span={8} style={{ display: 'flex', alignItems: 'end' }}>
                <Space>
                  <Button type="primary" style={{ width: 80 }} onClick={handleSearch}>查询</Button>
                  <Button style={{ width: 80 }} onClick={handleReset}>清空</Button>
                </Space>
              </Col>
            </>
          )}
        </Row>
        <div style={{ marginTop: 16 }}>
          <a onClick={() => setIsCollapsed(!isCollapsed)}>{isCollapsed ? '展开 v' : '收起 ^'}</a>
        </div>
      </Card>

      {role === 'applicant' && (
        <Button type="primary" style={{ marginBottom: 16, width: 100 }} onClick={() => navigate('/create')}>
          新建
        </Button>
      )}

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Drawer
        title="审批详情"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        footer={
          (role === 'approver' && currentDetail?.status === 'pending') ? (
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => handleDrawerAction('rejected')} danger>拒绝</Button>
                <Button type="primary" onClick={() => handleDrawerAction('approved')}>通过</Button>
              </Space>
            </div>
          ) : null
        }
      >
        {currentDetail && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="审批项目">{currentDetail.projectName}</Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Tag>{currentDetail.status === 'pending' ? '待审批' : currentDetail.status === 'approved' ? '审批通过' : '审批拒绝'}</Tag>
            </Descriptions.Item>

            {/* 🔴 核心修改点：这里调用 getDeptLabel 函数 */}
            <Descriptions.Item label="申请部门">
              {getDeptLabel(currentDetail.department)}
            </Descriptions.Item>

            <Descriptions.Item label="执行日期">{currentDetail.executeDate}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{currentDetail.createTime}</Descriptions.Item>
            <Descriptions.Item label="审批内容">
              <div style={{ whiteSpace: 'pre-wrap' }}>{currentDetail.content}</div>
            </Descriptions.Item>
            {/* ✅ 新增：图片展示区 */}
            <Descriptions.Item label="图片附件">
              {currentDetail.images && currentDetail.images.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Image.PreviewGroup>
                    {currentDetail.images.map((img, idx) => (
                      <Image key={idx} width={100} src={img} style={{ borderRadius: 4, border: '1px solid #eee' }} />
                    ))}
                  </Image.PreviewGroup>
                </div>
              ) : '无'}
            </Descriptions.Item>

            {/* ✅ 新增：文件下载区 */}
            <Descriptions.Item label="表格附件">
              {currentDetail.attachments && currentDetail.attachments.length > 0 ? (
                <div>
                  {currentDetail.attachments.map((file, idx) => (
                    <div key={idx} style={{ marginBottom: 4 }}>
                      <a href={file.url} download={file.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <DownloadOutlined /> {file.name}
                      </a>
                    </div>
                  ))}
                </div>
              ) : '无'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default ApprovalList;