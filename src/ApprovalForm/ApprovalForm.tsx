import React, { useEffect, useState } from 'react';
import { Card, Form, Input, DatePicker, Cascader, Button, message, Space, Modal, Upload } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { departmentOptions } from '../mock';
import { approvalApi } from '../services/api';

const { TextArea } = Input;

// ✅ 1. 定义组件映射表 (Component Map)
// 将后端返回的字符串 Key 映射为真实的前端组件
const COMPONENT_MAP: Record<string, React.ReactNode> = {
  Input: <Input placeholder="请输入" style={{ width: '100%', height: 40 }} />,
  Textarea: <TextArea rows={6} placeholder="请输入" showCount style={{ width: '100%' }} />,
  DepartmentSelect: <Cascader options={departmentOptions} placeholder="请选择部门" style={{ width: '100%', height: 40 }} />,
  DateTimePicker: <DatePicker style={{ width: '100%', height: 40 }} />,
};

// 辅助函数
const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const ApprovalForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [formSchema, setFormSchema] = useState<any[]>([]); // ✅ 存储后端返回的 Schema
  
  // 文件上传状态 (保留之前的上传功能)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [excelList, setExcelList] = useState<UploadFile[]>([]);

  // ✅ 2. 初始化：获取 Schema 配置 + 获取详情数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // A. 并行请求：获取表单配置 & 详情数据(如果是编辑模式)
        const [schemaRes, detailRes] = await Promise.all([
          approvalApi.getSchema(),
          isEdit && id ? approvalApi.getDetail(id) : Promise.resolve(null)
        ]);

        // B. 设置 Schema
        if (schemaRes.data && schemaRes.data.data) {
          setFormSchema(schemaRes.data.data);
        }

        // C. 回显详情数据
        if (detailRes && detailRes.data) {
          const data = detailRes.data;
          form.setFieldsValue({
            ...data,
            executeDate: data.executeDate ? dayjs(data.executeDate) : undefined,
          });

          // 回显文件
          if (data.images) {
            setFileList(data.images.map((url: string, index: number) => ({
              uid: `-${index}`, name: `img-${index}`, status: 'done', url
            })));
          }
          if (data.attachments) {
            setExcelList(data.attachments.map((item: any, index: number) => ({
              uid: `-${index}`, name: item.name, status: 'done', url: item.url
            })));
          }
        }
      } catch (error) {
        console.error(error);
        message.error('页面初始化失败');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEdit, form]);

  // 提交逻辑 (保持不变)
  const handleFinish = async (values: any) => {
    try {
      // 处理文件
      const imagePromises = fileList.map(async (file) => file.url || await getBase64(file.originFileObj as File));
      const images = await Promise.all(imagePromises);

      const attachPromises = excelList.map(async (file) => {
        if (file.url) return { name: file.name, url: file.url };
        const base64 = await getBase64(file.originFileObj as File);
        return { name: file.name, url: base64 };
      });
      const attachments = await Promise.all(attachPromises);

      const payload = {
        ...values,
        executeDate: values.executeDate?.format('YYYY-MM-DD'), // 这里的可选链防止刚加载未选日期时报错
        images,
        attachments,
      };

      if (isEdit && id) {
        await approvalApi.update(id, payload);
        message.success('修改成功');
      } else {
        await approvalApi.create(payload);
        message.success('创建成功');
      }
      navigate('/'); 
    } catch (error) {
      console.error(error);
      message.error('提交失败');
    }
  };

  const dummyRequest = ({ onSuccess }: any) => setTimeout(() => onSuccess("ok"), 500);

  // ✅ 3. 动态渲染函数
  const renderDynamicFields = () => {
    return formSchema.map((fieldConfig) => {
      // 解析验证规则
      const rules = [];
      if (fieldConfig.validator?.required) {
        rules.push({ required: true, message: `请输入${fieldConfig.name}` });
      }
      if (fieldConfig.validator?.maxCount) {
        rules.push({ max: fieldConfig.validator.maxCount, message: `最大长度 ${fieldConfig.validator.maxCount}` });
      }

      // 根据 component 字符串从 MAP 中取组件
      // 默认回落到 Input 防止后端传错崩坏
      const Component = COMPONENT_MAP[fieldConfig.component] || COMPONENT_MAP['Input'];

      // 克隆组件以注入额外的属性 (如果需要)
      const FormComponent = React.cloneElement(Component as React.ReactElement, {
         maxLength: fieldConfig.validator?.maxCount 
      } as any);

      return (
        <Form.Item
          key={fieldConfig.field}
          label={fieldConfig.name}
          name={fieldConfig.field}
          rules={rules}
        >
          {FormComponent}
        </Form.Item>
      );
    });
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)', display: 'flex', justifyContent: 'center' }}>
      <Card 
        loading={loading}
        style={{ width: '100%' }} 
        title={<span style={{ fontSize: 18, fontWeight: 'bold' }}>{isEdit ? '审批单修改' : '新建审批单 (动态渲染)'}</span>}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          
          {/* ✅ 动态渲染区域 */}
          {renderDynamicFields()}

          {/* 固定渲染区域 (附件上传比较复杂，通常作为固定块处理，或者后端 Schema 需要支持更复杂的配置) */}
          <Form.Item label="图片附件">
            <Upload customRequest={dummyRequest} listType="picture-card" fileList={fileList} onChange={({ fileList }) => setFileList(fileList)} maxCount={5} accept="image/*">
              {fileList.length < 5 && <div><PlusOutlined /><div>上传</div></div>}
            </Upload>
          </Form.Item>

          <Form.Item label="表格附件">
            <Upload customRequest={dummyRequest} fileList={excelList} onChange={({ fileList }) => setExcelList(fileList)} maxCount={1} accept=".xlsx,.xls,.csv">
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>

          <div style={{ marginTop: 20 }}>
            <Space size={20}>
              <Button htmlType="submit" type="primary">保存</Button>
              <Button onClick={() => Modal.confirm({ title: '确认离开?', onOk: () => navigate('/') })}>取消</Button>
            </Space>
          </div>
        </Form>
      </Card>
      
      <Modal open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)}>
        <img style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default ApprovalForm;