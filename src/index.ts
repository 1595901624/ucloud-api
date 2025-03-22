import axios from 'axios';
import crypto from 'crypto';
import config from '../config.json';

// 请求参数接口
interface RebootULHostInstanceRequest {
  Action: 'RebootULHostInstance';
  PublicKey: string;
  Signature: string;
  Region: string;
  ProjectId?: string;
  ULHostId: string;
}

// 响应参数接口
interface RebootULHostInstanceResponse {
  RetCode: number;
  Action: string;
  Message?: string;
  ULHostId?: string;
}

// 生成签名
function generateSignature(params: Record<string, any>, privateKey: string): string {
  // 1. 参数按名称升序排列并拼接
  const sortedParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined) // 排除未定义的值
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .reduce((acc, [key, value]) => {
      // 处理不同类型的值
      let processedValue = value;
      if (typeof value === 'boolean') {
        processedValue = value ? 'true' : 'false';
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        processedValue = value.toString().replace(/\.0+$/, '');
      }
      return acc + key + processedValue;
    }, '');

  // 2. 拼接私钥
  const signString = sortedParams + privateKey;

  // 3. 计算 SHA1
  return crypto.createHash('sha1')
    .update(signString)
    .digest('hex');
}

// 修改 API 调用函数
async function rebootULHostInstance(
  params: Omit<RebootULHostInstanceRequest, 'Signature'>,
  privateKey: string
): Promise<RebootULHostInstanceResponse> {
  const baseUrl = 'https://api.ucloud.cn/';

  // 生成签名
  const signature = generateSignature(params, privateKey);
  const fullParams = { ...params, Signature: signature };

  try {
    const response = await axios.get(baseUrl, { params: fullParams });
    return response.data as RebootULHostInstanceResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        RetCode: 1,
        Action: 'RebootULHostInstanceResponse',
        Message: error.message
      };
    }
    return {
      RetCode: 1,
      Action: 'RebootULHostInstanceResponse',
      Message: '未知错误'
    };
  }
}

// 使用示例
async function main() {
  console.log("restarting...")
  const privateKey = config.privateKey;
  const params = {
    Action: 'RebootULHostInstance' as const,
    PublicKey: config.publicKey,
    Region: 'sg-02',
    ULHostId: 'ulhost-14r8faoqut7d'
    // ProjectId: 'org-xxx'
  };

  const response = await rebootULHostInstance(params, privateKey);
  console.log('API Response:', response);
}

main().catch(console.error);
