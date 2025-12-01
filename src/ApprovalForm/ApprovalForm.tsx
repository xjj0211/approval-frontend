import React, { useEffect, useState } from 'react';
import { Card, Form, Input, DatePicker, Cascader, Button, message, Space, Modal, Upload } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd/es/upload/interface';
import { departmentOptions } from '../mock';
import { approvalApi } from '../services/api';

const { TextArea } = Input;

// 组件映射表
const COMPONENT_MAP: Record<string, React.ReactNode> = {
  Input: <Input placeholder="请输入" style={{ width: '100%', height: 40 }} />,
  Textarea: <TextArea rows={6} placeholder="请输入" showCount style={{ width: '100%' }} />,
  DepartmentSelect: <Cascader options={departmentOptions} placeholder="请选择部门" style={{ width: '100%', height: 40 }} />,
  DateTimePicker: <DatePicker style={{ width: '100%', height: 40 }} />,
};

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

  const [loading, setLoading] = useState(false);
  const [formSchema, setFormSchema] = useState<any[]>([]);
  
  // 图片预览状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [excelList, setExcelList] = useState<UploadFile[]>([]);

  // 初始化
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [schemaRes, detailRes] = await Promise.all([
          approvalApi.getSchema(),
          isEdit && id ? approvalApi.getDetail(id) : Promise.resolve(null)
        ]);

        if (schemaRes.data && schemaRes.data.data) {
          setFormSchema(schemaRes.data.data);
        }

        if (detailRes && detailRes.data) {
          const data = detailRes.data;
          form.setFieldsValue({
            ...data,
            executeDate: data.executeDate ? dayjs(data.executeDate) : undefined,
          });

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

  // 处理预览 (让 setPreviewImage 被使用)
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleFinish = async (values: any) => {
    try {
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
        executeDate: values.executeDate?.format('YYYY-MM-DD'),
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

  const renderDynamicFields = () => {
    return formSchema.map((fieldConfig) => {
      const rules = [];
      if (fieldConfig.validator?.required) {
        rules.push({ required: true, message: `请输入${fieldConfig.name}` });
      }
      if (fieldConfig.validator?.maxCount) {
        rules.push({ max: fieldConfig.validator.maxCount, message: `最大长度 ${fieldConfig.validator.maxCount}` });
      }

      const Component = COMPONENT_MAP[fieldConfig.component] || COMPONENT_MAP['Input'];
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
        title={<span style={{ fontSize: 18, fontWeight: 'bold' }}>{isEdit ? '审批单修改' : '新建审批单'}</span>}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          
          {renderDynamicFields()}

          <Form.Item label="图片附件">
            <Upload 
              customRequest={dummyRequest} 
              listType="picture-card" 
              fileList={fileList} 
              onChange={({ fileList }) => setFileList(fileList)} 
              onPreview={handlePreview} 
              maxCount={5} 
              accept="image/*"
            >
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