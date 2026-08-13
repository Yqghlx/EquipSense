import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useFmeaKnowledgeRuleOptions,
  type FmeaKnowledgeRuleOption,
} from '../useFmea';

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

/** 创建不自动重试的查询客户端，避免失败测试产生额外请求。 */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockOption: FmeaKnowledgeRuleOption = {
  id: 'rule-1',
  deviceType: '电机',
  name: '电机过载规则',
  enabled: true,
  isSystemPreset: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useFmeaKnowledgeRuleOptions', () => {
  it('应按设备类型和当前规则 ID 查询可选规则', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [mockOption] });

    const { result } = renderHook(
      () => useFmeaKnowledgeRuleOptions({ deviceType: '电机', selectedRuleId: 'rule-1' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/fmea/knowledge-rules', {
      params: { deviceType: '电机', selectedRuleId: 'rule-1' },
    });
    expect(result.current.data).toEqual([mockOption]);
  });

  it('表单关闭时不应发起规则选项请求', () => {
    renderHook(
      () => useFmeaKnowledgeRuleOptions({}, { enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
