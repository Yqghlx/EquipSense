import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useKnowledgeRules,
  useCreateKnowledgeRule,
  usePendingRules,
  useApprovePendingRule,
  useRejectPendingRule,
  useFaultCases,
  useImportPresetRules,
  useApproveWithEdit,
  useUpdateKnowledgeRule,
  useToggleKnowledgeRule,
  useImportPreview,
  useImportRules,
  useExportRules,
  useRuleVersions,
  useRollbackRule,
} from '../useKnowledge';
import type {
  KnowledgeRule,
  PendingRule,
  FaultCase,
  PagedResult,
  ImportPreviewResult,
  ImportResult,
  KnowledgeRuleVersion,
} from '../../types';

// Mock axios api 模块
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock window.URL 对象（useExportRules 依赖 blob URL）
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
vi.stubGlobal('URL', {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

const mockedApi = vi.mocked(api);

/** 创建 QueryClient 包装器，用于 hook 测试 */
const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

// ============================================================================
// Mock 数据（匹配 types/index.ts 中的类型定义）
// ============================================================================

const mockKnowledgeRule: KnowledgeRule = {
  id: 'rule-001',
  tenantId: 'tenant-001',
  deviceType: 'pump',
  name: '水泵振动超标规则',
  conditions: '振动幅度 > 5mm/s 且持续 10 分钟',
  conclusion: '轴承磨损导致振动异常',
  recommendedActions: '建议停机检查轴承，必要时更换',
  checkSteps: '1. 检查轴承间隙；2. 测量振动频谱',
  confidenceWeight: 0.85,
  source: 'manual',
  accuracyRate: 92.5,
  successCount: 15,
  enabled: true,
  version: 3,
  createdBy: 'user-001',
  createdAt: '2026-01-10T08:00:00Z',
};

const mockPendingRule: PendingRule = {
  id: 'pending-001',
  tenantId: 'tenant-001',
  deviceType: 'compressor',
  name: '压缩机温度异常候选规则',
  conditions: '排气温度 > 120°C',
  conclusion: '冷却系统效率下降',
  recommendedActions: '检查冷却液液位，清洗散热器',
  sourceWorkorderId: 'wo-001',
  sourceAlertId: 'alert-001',
  sourceAnalysisId: 'analysis-001',
  confidence: 0.78,
  reviewStatus: 'Pending',
  reviewedBy: undefined,
  reviewComment: undefined,
  reviewedAt: undefined,
  createdAt: '2026-02-15T10:30:00Z',
};

const mockFaultCase: FaultCase = {
  id: 'case-001',
  tenantId: 'tenant-001',
  deviceId: 'device-001',
  deviceType: 'pump',
  faultOccurredAt: '2026-03-01T14:00:00Z',
  faultDescription: '水泵轴承温度突然升高至 95°C',
  rootCause: '轴承润滑脂干涸导致摩擦过热',
  solution: '补充润滑脂，运行 24 小时后复检',
  repairDurationMinutes: 45,
  isVerified: true,
  createdAt: '2026-03-02T09:00:00Z',
};

const mockRuleVersion: KnowledgeRuleVersion = {
  id: 'version-001',
  ruleId: 'rule-001',
  version: 2,
  snapshot: '{"name":"水泵振动超标规则","conditions":"振动幅度 > 4mm/s"}',
  changedBy: 'user-001',
  changeSummary: '调整振动阈值从 4mm/s 到 5mm/s',
  createdAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useKnowledgeRules — 知识规则列表查询
// ============================================================================

describe('useKnowledgeRules', () => {
  const mockPagedResult: PagedResult<KnowledgeRule> = {
    items: [mockKnowledgeRule],
    total: 1,
    page: 1,
    pageSize: 20,
  };

  it('应成功获取知识规则列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useKnowledgeRules({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/knowledge/rules?'),
    );
  });

  it('应正确传递 deviceType 过滤参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useKnowledgeRules({ page: 1, pageSize: 20, deviceType: 'pump' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('deviceType=pump');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(
      () => useKnowledgeRules({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ============================================================================
// useCreateKnowledgeRule — 创建知识规则
// ============================================================================

describe('useCreateKnowledgeRule', () => {
  it('应调用 POST /knowledge/rules 创建规则', async () => {
    const createReq = {
      deviceType: 'pump',
      name: '新水泵规则',
      conditions: '温度 > 80°C',
      conclusion: '过热',
      confidenceWeight: 0.9,
      source: 'manual',
      enabled: true,
      version: 1,
      createdBy: 'user-001',
    };

    mockedApi.post.mockResolvedValueOnce({ data: mockKnowledgeRule });

    const { result } = renderHook(
      () => useCreateKnowledgeRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(createReq);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/knowledge/rules', createReq);
    expect(result.current.data).toEqual(mockKnowledgeRule);
  });
});

// ============================================================================
// usePendingRules — 候选规则列表查询
// ============================================================================

describe('usePendingRules', () => {
  const mockPagedResult: PagedResult<PendingRule> = {
    items: [mockPendingRule],
    total: 1,
    page: 1,
    pageSize: 20,
  };

  it('应成功获取候选规则列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => usePendingRules({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/knowledge/pending-rules?'),
    );
  });

  it('应正确传递 reviewStatus 过滤参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => usePendingRules({ page: 1, pageSize: 20, reviewStatus: 'Pending' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('reviewStatus=Pending');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('网络错误'));

    const { result } = renderHook(
      () => usePendingRules({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ============================================================================
// useApprovePendingRule — 批准候选规则
// ============================================================================

describe('useApprovePendingRule', () => {
  it('应调用 PUT 批准接口并通过 id 和 comment', async () => {
    const approvedRule = { ...mockPendingRule, reviewStatus: 'Approved' as const };
    mockedApi.put.mockResolvedValueOnce({ data: approvedRule });

    const { result } = renderHook(
      () => useApprovePendingRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'pending-001', comment: '规则合理，批准' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/knowledge/pending-rules/pending-001/approve',
      { comment: '规则合理，批准' },
    );
    expect(result.current.data).toEqual(approvedRule);
  });

  it('无 comment 时也应正常调用', async () => {
    const approvedRule = { ...mockPendingRule, reviewStatus: 'Approved' as const };
    mockedApi.put.mockResolvedValueOnce({ data: approvedRule });

    const { result } = renderHook(
      () => useApprovePendingRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'pending-001' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/knowledge/pending-rules/pending-001/approve',
      { comment: undefined },
    );
  });
});

// ============================================================================
// useRejectPendingRule — 驳回候选规则
// ============================================================================

describe('useRejectPendingRule', () => {
  it('应调用 PUT 驳回接口', async () => {
    const rejectedRule = { ...mockPendingRule, reviewStatus: 'Rejected' as const };
    mockedApi.put.mockResolvedValueOnce({ data: rejectedRule });

    const { result } = renderHook(
      () => useRejectPendingRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'pending-001', comment: '条件描述不够清晰' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/knowledge/pending-rules/pending-001/reject',
      { comment: '条件描述不够清晰' },
    );
    expect(result.current.data).toEqual(rejectedRule);
  });

  it('无 comment 时也应正常调用', async () => {
    const rejectedRule = { ...mockPendingRule, reviewStatus: 'Rejected' as const };
    mockedApi.put.mockResolvedValueOnce({ data: rejectedRule });

    const { result } = renderHook(
      () => useRejectPendingRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'pending-002' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/knowledge/pending-rules/pending-002/reject',
      { comment: undefined },
    );
  });
});

// ============================================================================
// useFaultCases — 故障案例列表
// ============================================================================

describe('useFaultCases', () => {
  const mockPagedResult: PagedResult<FaultCase> = {
    items: [mockFaultCase],
    total: 1,
    page: 1,
    pageSize: 20,
  };

  it('应成功获取故障案例列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useFaultCases({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/knowledge/cases?'),
    );
  });

  it('应正确传递 deviceType 过滤参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useFaultCases({ page: 1, pageSize: 20, deviceType: 'pump' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('deviceType=pump');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器错误'));

    const { result } = renderHook(
      () => useFaultCases({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ============================================================================
// useImportPresetRules — 导入行业预置规则
// ============================================================================

describe('useImportPresetRules', () => {
  it('应调用 POST /knowledge/rules/preset-import', async () => {
    const importResult: ImportResult = {
      imported: 10,
      skipped: 2,
      failed: 0,
      errors: [],
    };

    mockedApi.post.mockResolvedValueOnce({ data: importResult });

    const { result } = renderHook(
      () => useImportPresetRules(),
      { wrapper: createWrapper() },
    );

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/knowledge/rules/preset-import');
    expect(result.current.data).toEqual(importResult);
  });
});

// ============================================================================
// useApproveWithEdit — 编辑后批准候选规则
// ============================================================================

describe('useApproveWithEdit', () => {
  it('应调用 PUT approve-with-edit 接口并传递编辑参数', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(
      () => useApproveWithEdit(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      id: 'pending-001',
      adjustedConditions: '排气温度 > 130°C',
      adjustedConclusion: '冷却系统严重故障',
      adjustedName: '压缩机高温规则（已调整）',
      comment: '阈值上调以减少误报',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 验证 URL 路径包含 id
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/knowledge/pending-rules/pending-001/approve-with-edit',
      expect.objectContaining({
        adjustedConditions: '排气温度 > 130°C',
        adjustedConclusion: '冷却系统严重故障',
        adjustedName: '压缩机高温规则（已调整）',
        comment: '阈值上调以减少误报',
      }),
    );
  });

  it('仅传 id 无编辑字段时也应正常调用', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(
      () => useApproveWithEdit(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'pending-002' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/knowledge/pending-rules/pending-002/approve-with-edit',
      {},
    );
  });
});

// ============================================================================
// useUpdateKnowledgeRule — 更新知识规则
// ============================================================================

describe('useUpdateKnowledgeRule', () => {
  it('应调用 PUT /knowledge/rules/{id}，mutationFn 解构 { id, ...request }', async () => {
    const updatedRule = { ...mockKnowledgeRule, name: '水泵振动超标规则（已更新）' };
    mockedApi.put.mockResolvedValueOnce({ data: updatedRule });

    const { result } = renderHook(
      () => useUpdateKnowledgeRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      id: 'rule-001',
      name: '水泵振动超标规则（已更新）',
      conditions: '振动幅度 > 6mm/s',
      changeSummary: '提高振动阈值',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 源码中 mutationFn 解构了 { id, ...request }，所以发送给 API 的对象不包含 id
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/knowledge/rules/rule-001',
      expect.objectContaining({
        name: '水泵振动超标规则（已更新）',
        conditions: '振动幅度 > 6mm/s',
        changeSummary: '提高振动阈值',
      }),
    );
    expect(mockedApi.put).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'rule-001' }),
    );
    expect(result.current.data).toEqual(updatedRule);
  });
});

// ============================================================================
// useToggleKnowledgeRule — 切换规则启用/禁用
// ============================================================================

describe('useToggleKnowledgeRule', () => {
  it('应调用 PATCH /knowledge/rules/{id}/toggle', async () => {
    const toggledRule = { ...mockKnowledgeRule, enabled: false };
    mockedApi.patch.mockResolvedValueOnce({ data: toggledRule });

    const { result } = renderHook(
      () => useToggleKnowledgeRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('rule-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.patch).toHaveBeenCalledWith('/knowledge/rules/rule-001/toggle');
    expect(result.current.data).toEqual(toggledRule);
  });
});

// ============================================================================
// useImportPreview — 导入预览
// ============================================================================

describe('useImportPreview', () => {
  it('应通过 FormData 上传文件并获取预览结果', async () => {
    const previewResult: ImportPreviewResult = {
      validItems: [
        {
          rowNumber: 1,
          deviceType: 'pump',
          name: '导入规则 1',
          conditions: '温度 > 90°C',
          conclusion: '过热',
          confidenceWeight: 0.8,
        },
      ],
      errors: [
        { rowNumber: 2, message: '缺少必填字段 name', rawContent: '' },
      ],
      totalRows: 2,
      validCount: 1,
      errorCount: 1,
    };

    mockedApi.post.mockResolvedValueOnce({ data: previewResult });

    const { result } = renderHook(
      () => useImportPreview(),
      { wrapper: createWrapper() },
    );

    const file = new File(['test content'], 'rules.csv', { type: 'text/csv' });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 验证调用 URL 包含 preview=true
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/knowledge/rules/import?preview=true',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    expect(result.current.data).toEqual(previewResult);
  });
});

// ============================================================================
// useImportRules — 批量导入规则
// ============================================================================

describe('useImportRules', () => {
  it('应通过 FormData 上传文件执行实际导入', async () => {
    const importResult: ImportResult = {
      imported: 5,
      skipped: 1,
      failed: 1,
      errors: [{ rowNumber: 3, message: '数据格式错误', rawContent: 'bad row' }],
    };

    mockedApi.post.mockResolvedValueOnce({ data: importResult });

    const { result } = renderHook(
      () => useImportRules(),
      { wrapper: createWrapper() },
    );

    const file = new File(['import data'], 'rules.json', { type: 'application/json' });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 验证调用 URL 不包含 preview 参数
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/knowledge/rules/import',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    expect(result.current.data).toEqual(importResult);
  });
});

// ============================================================================
// useExportRules — 导出规则（blob 响应 + 触发下载）
// ============================================================================

describe('useExportRules', () => {
  /** Mock 的 a 标签 click 方法 */
  let mockClick: ReturnType<typeof vi.fn>;
  /** createElement spy */
  let spyCreateElement: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockClick = vi.fn();
    // 只 mock createElement('a')，appendChild/removeChild 使用真实 DOM（不会破坏 React 渲染）
    spyCreateElement = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const anchor = document.createElementNS('http://www.w3.org/1999/xhtml', 'a') as HTMLAnchorElement;
        anchor.click = mockClick;
        return anchor;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag);
    });
  });

  afterEach(() => {
    spyCreateElement.mockRestore();
  });

  it('应以 blob 响应获取文件并触发浏览器下载', async () => {
    const mockBlob = new Blob(['id,name\n1,test'], { type: 'text/csv' });
    mockedApi.get.mockResolvedValueOnce({ data: mockBlob });

    const { result } = renderHook(
      () => useExportRules(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ format: 'csv' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 验证 API 调用参数
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/knowledge/rules/export?'),
      { responseType: 'blob' },
    );
    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('format=csv');

    // 验证 blob URL 创建与释放
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    // 验证 a 标签点击触发下载
    expect(spyCreateElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('应支持 JSON 格式并传递 deviceType 参数', async () => {
    const mockBlob = new Blob(['[]'], { type: 'application/json' });
    mockedApi.get.mockResolvedValueOnce({ data: mockBlob });

    const { result } = renderHook(
      () => useExportRules(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ format: 'json', deviceType: 'pump' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('format=json');
    expect(calledUrl).toContain('deviceType=pump');
  });
});

// ============================================================================
// useRuleVersions — 规则版本历史
// ============================================================================

describe('useRuleVersions', () => {
  it('ruleId 非空时应查询版本历史', async () => {
    const versions = [mockRuleVersion];
    mockedApi.get.mockResolvedValueOnce({ data: versions });

    const { result } = renderHook(
      () => useRuleVersions('rule-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(versions);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/knowledge/rules/rule-001/versions',
    );
  });

  it('ruleId 为 null 时应禁用查询', () => {
    const { result } = renderHook(
      () => useRuleVersions(null),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useRollbackRule — 回滚规则版本
// ============================================================================

describe('useRollbackRule', () => {
  it('应调用 POST rollback 接口并传递 ruleId 和 version', async () => {
    const rolledBackRule = { ...mockKnowledgeRule, version: 2 };
    mockedApi.post.mockResolvedValueOnce({ data: rolledBackRule });

    const { result } = renderHook(
      () => useRollbackRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ ruleId: 'rule-001', version: 2 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/knowledge/rules/rule-001/rollback?version=2',
    );
    expect(result.current.data).toEqual(rolledBackRule);
  });
});
