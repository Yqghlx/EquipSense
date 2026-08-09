/**
* 审批管理 TanStack Query Hooks
*
* 提供审批链模板的查询和变更、工单审批记录查询、
* 待审批列表查询以及审批通过/驳回等 React Query 封装。
* 所有变更操作成功后自动刷新相关查询缓存。
*/
import { useQuery, useMutation, useQueryClient } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=1d2f6f90";
import api from "/src/lib/api.ts";
/**
* 获取审批链模板列表
*
* 返回当前租户下所有审批链模板配置。
*/
export function useApprovalChains() {
	return useQuery({
		queryKey: ["approval-chains"],
		queryFn: async () => {
			const { data } = await api.get("/approval-chains");
			return data;
		}
	});
}
/**
* 获取工单审批记录
*
* 返回指定工单的所有审批步骤及状态。
* 当 workOrderId 为空时自动禁用查询，避免无效请求。
*/
export function useWorkOrderApprovals(workOrderId) {
	return useQuery({
		queryKey: [
			"work-orders",
			workOrderId,
			"approvals"
		],
		queryFn: async () => {
			const { data } = await api.get(`/work-orders/${workOrderId}/approvals`);
			return data;
		},
		enabled: !!workOrderId
	});
}
/**
* 获取待我审批列表
*
* 返回当前用户待处理的所有审批任务。
*/
export function usePendingApprovals() {
	return useQuery({
		queryKey: ["approval-chains", "pending"],
		queryFn: async () => {
			const { data } = await api.get("/approval-chains/pending");
			return data;
		}
	});
}
/**
* 创建审批链模板
*
* 成功后自动刷新审批链列表缓存。
*/
export function useCreateApprovalChain() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (req) => {
			const { data } = await api.post("/approval-chains", req);
			return data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["approval-chains"] })
	});
}
/**
* 更新审批链模板
*
* 成功后自动刷新审批链列表缓存。
*/
export function useUpdateApprovalChain() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, ...req }) => {
			const { data } = await api.put(`/approval-chains/${id}`, req);
			return data;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["approval-chains"] })
	});
}
/**
* 删除审批链模板
*
* 成功后自动刷新审批链列表缓存。
*/
export function useDeleteApprovalChain() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (id) => {
			await api.delete(`/approval-chains/${id}`);
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["approval-chains"] })
	});
}
/**
* 提交工单验收
*
* 将 InProgress 状态的工单提交进入审批流程，
* 成功后刷新工单详情和列表缓存。
*/
export function useSubmitWorkOrder() {
	const qc = useQueryClient();
	return useMutation({
		// 提交验收与完成工单共享 CompleteWorkOrderRequest（携带 resolution/executionReport/requiredParts）。
		// 原 useSubmitWorkOrder 只传 id 不传 body，后端 SubmitAsync 写入的 executionReport/requiredParts 永远为空
		// → 知识沉淀 FaultCase.Solution/PartsUsed 数据源缺失（回归 #252）。现与完成工单入口一致透传请求体。
		mutationFn: async ({ id, ...req }) => {
			await api.post(`/work-orders/${id}/submit`, req);
		},
		onSuccess: (_, variables) => {
			qc.invalidateQueries({ queryKey: ["work-orders", variables.id] });
			qc.invalidateQueries({ queryKey: ["work-orders"] });
		}
	});
}
/**
* 审批通过
*
* 当前审批步骤通过，成功后刷新审批记录和工单缓存。
*/
export function useApproveWorkOrder() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, comment }) => {
			await api.post(`/work-orders/${id}/approve`, { comment });
		},
		onSuccess: (_, { id }) => {
			qc.invalidateQueries({ queryKey: [
				"work-orders",
				id,
				"approvals"
			] });
			qc.invalidateQueries({ queryKey: ["work-orders", id] });
			qc.invalidateQueries({ queryKey: ["work-orders"] });
		}
	});
}
/**
* 审批驳回
*
* 当前审批步骤驳回，可附驳回意见，
* 成功后刷新审批记录和工单缓存。
*/
export function useRejectApproval() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, comment }) => {
			await api.post(`/work-orders/${id}/reject-approval`, { comment });
		},
		onSuccess: (_, { id }) => {
			qc.invalidateQueries({ queryKey: [
				"work-orders",
				id,
				"approvals"
			] });
			qc.invalidateQueries({ queryKey: ["work-orders", id] });
			qc.invalidateQueries({ queryKey: ["work-orders"] });
		}
	});
}

//# sourceMappingURL=data:application/json;base64,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LEVBQUUsVUFBVSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUM7R0FDdEQsR0FBRyxrQkFBa0IsRUFBRSxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUM7RUFDcEQ7Q0FDRixDQUFDO0FBQ0g7Ozs7Ozs7QUFRQSxPQUFPLFNBQVMsb0JBQW9CO0NBQ2xDLE1BQU0sS0FBSyxlQUFlO0NBQzFCLE9BQU8sWUFBWTtFQUNqQixZQUFZLE9BQU8sRUFBRSxJQUFJLGNBQWdEO0dBQ3ZFLE1BQU0sSUFBSSxLQUFLLGdCQUFnQixHQUFHLG1CQUFtQixFQUFFLFFBQVEsQ0FBQztFQUNsRTtFQUNBLFlBQVksR0FBRyxFQUFFLFNBQVM7R0FDeEIsR0FBRyxrQkFBa0IsRUFBRSxVQUFVO0lBQUM7SUFBZTtJQUFJO0dBQVcsRUFBRSxDQUFDO0dBQ25FLEdBQUcsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUM7R0FDdEQsR0FBRyxrQkFBa0IsRUFBRSxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUM7RUFDcEQ7Q0FDRixDQUFDO0FBQ0giLCJuYW1lcyI6W10sInNvdXJjZXMiOlsidXNlQXBwcm92YWxzLnRzIl0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog5a6h5om5566h55CGIFRhblN0YWNrIFF1ZXJ5IEhvb2tzXG4gKlxuICog5o+Q5L6b5a6h5om56ZO+5qih5p2/55qE5p+l6K+i5ZKM5Y+Y5pu044CB5bel5Y2V5a6h5om56K6w5b2V5p+l6K+i44CBXG4gKiDlvoXlrqHmibnliJfooajmn6Xor6Lku6Xlj4rlrqHmibnpgJrov4cv6amz5Zue562JIFJlYWN0IFF1ZXJ5IOWwgeijheOAglxuICog5omA5pyJ5Y+Y5pu05pON5L2c5oiQ5Yqf5ZCO6Ieq5Yqo5Yi35paw55u45YWz5p+l6K+i57yT5a2Y44CCXG4gKi9cbmltcG9ydCB7IHVzZVF1ZXJ5LCB1c2VNdXRhdGlvbiwgdXNlUXVlcnlDbGllbnQgfSBmcm9tICdAdGFuc3RhY2svcmVhY3QtcXVlcnknO1xuaW1wb3J0IGFwaSBmcm9tICcuLi9saWIvYXBpJztcbmltcG9ydCB0eXBlIHtcbiAgQXBwcm92YWxDaGFpblRlbXBsYXRlLFxuICBXb3JrT3JkZXJBcHByb3ZhbER0byxcbiAgQ3JlYXRlQXBwcm92YWxDaGFpblJlcXVlc3QsXG4gIENvbXBsZXRlV29ya09yZGVyUmVxdWVzdCxcbn0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vKipcbiAqIOiOt+WPluWuoeaJuemTvuaooeadv+WIl+ihqFxuICpcbiAqIOi/lOWbnuW9k+WJjeenn+aIt+S4i+aJgOacieWuoeaJuemTvuaooeadv+mFjee9ruOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlQXBwcm92YWxDaGFpbnMoKSB7XG4gIHJldHVybiB1c2VRdWVyeSh7XG4gICAgcXVlcnlLZXk6IFsnYXBwcm92YWwtY2hhaW5zJ10sXG4gICAgcXVlcnlGbjogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgeyBkYXRhIH0gPSBhd2FpdCBhcGkuZ2V0PEFwcHJvdmFsQ2hhaW5UZW1wbGF0ZVtdPignL2FwcHJvdmFsLWNoYWlucycpO1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcbiAgfSk7XG59XG5cbi8qKlxuICog6I635Y+W5bel5Y2V5a6h5om56K6w5b2VXG4gKlxuICog6L+U5Zue5oyH5a6a5bel5Y2V55qE5omA5pyJ5a6h5om55q2l6aqk5Y+K54q25oCB44CCXG4gKiDlvZMgd29ya09yZGVySWQg5Li656m65pe26Ieq5Yqo56aB55So5p+l6K+i77yM6YG/5YWN5peg5pWI6K+35rGC44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VXb3JrT3JkZXJBcHByb3ZhbHMod29ya09yZGVySWQ6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICByZXR1cm4gdXNlUXVlcnkoe1xuICAgIHF1ZXJ5S2V5OiBbJ3dvcmstb3JkZXJzJywgd29ya09yZGVySWQsICdhcHByb3ZhbHMnXSxcbiAgICBxdWVyeUZuOiBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGFwaS5nZXQ8V29ya09yZGVyQXBwcm92YWxEdG9bXT4oXG4gICAgICAgIGAvd29yay1vcmRlcnMvJHt3b3JrT3JkZXJJZH0vYXBwcm92YWxzYCxcbiAgICAgICk7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuICAgIGVuYWJsZWQ6ICEhd29ya09yZGVySWQsXG4gIH0pO1xufVxuXG4vKipcbiAqIOiOt+WPluW+heaIkeWuoeaJueWIl+ihqFxuICpcbiAqIOi/lOWbnuW9k+WJjeeUqOaIt+W+heWkhOeQhueahOaJgOacieWuoeaJueS7u+WKoeOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlUGVuZGluZ0FwcHJvdmFscygpIHtcbiAgcmV0dXJuIHVzZVF1ZXJ5KHtcbiAgICBxdWVyeUtleTogWydhcHByb3ZhbC1jaGFpbnMnLCAncGVuZGluZyddLFxuICAgIHF1ZXJ5Rm46IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZGF0YSB9ID0gYXdhaXQgYXBpLmdldDxXb3JrT3JkZXJBcHByb3ZhbER0b1tdPignL2FwcHJvdmFsLWNoYWlucy9wZW5kaW5nJyk7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuICB9KTtcbn1cblxuLyoqXG4gKiDliJvlu7rlrqHmibnpk77mqKHmnb9cbiAqXG4gKiDmiJDlip/lkI7oh6rliqjliLfmlrDlrqHmibnpk77liJfooajnvJPlrZjjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUNyZWF0ZUFwcHJvdmFsQ2hhaW4oKSB7XG4gIGNvbnN0IHFjID0gdXNlUXVlcnlDbGllbnQoKTtcbiAgcmV0dXJuIHVzZU11dGF0aW9uKHtcbiAgICBtdXRhdGlvbkZuOiBhc3luYyAocmVxOiBDcmVhdGVBcHByb3ZhbENoYWluUmVxdWVzdCkgPT4ge1xuICAgICAgY29uc3QgeyBkYXRhIH0gPSBhd2FpdCBhcGkucG9zdDxBcHByb3ZhbENoYWluVGVtcGxhdGU+KCcvYXBwcm92YWwtY2hhaW5zJywgcmVxKTtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG4gICAgb25TdWNjZXNzOiAoKSA9PiBxYy5pbnZhbGlkYXRlUXVlcmllcyh7IHF1ZXJ5S2V5OiBbJ2FwcHJvdmFsLWNoYWlucyddIH0pLFxuICB9KTtcbn1cblxuLyoqXG4gKiDmm7TmlrDlrqHmibnpk77mqKHmnb9cbiAqXG4gKiDmiJDlip/lkI7oh6rliqjliLfmlrDlrqHmibnpk77liJfooajnvJPlrZjjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVVwZGF0ZUFwcHJvdmFsQ2hhaW4oKSB7XG4gIGNvbnN0IHFjID0gdXNlUXVlcnlDbGllbnQoKTtcbiAgcmV0dXJuIHVzZU11dGF0aW9uKHtcbiAgICBtdXRhdGlvbkZuOiBhc3luYyAoeyBpZCwgLi4ucmVxIH06IENyZWF0ZUFwcHJvdmFsQ2hhaW5SZXF1ZXN0ICYgeyBpZDogc3RyaW5nIH0pID0+IHtcbiAgICAgIGNvbnN0IHsgZGF0YSB9ID0gYXdhaXQgYXBpLnB1dDxBcHByb3ZhbENoYWluVGVtcGxhdGU+KGAvYXBwcm92YWwtY2hhaW5zLyR7aWR9YCwgcmVxKTtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG4gICAgb25TdWNjZXNzOiAoKSA9PiBxYy5pbnZhbGlkYXRlUXVlcmllcyh7IHF1ZXJ5S2V5OiBbJ2FwcHJvdmFsLWNoYWlucyddIH0pLFxuICB9KTtcbn1cblxuLyoqXG4gKiDliKDpmaTlrqHmibnpk77mqKHmnb9cbiAqXG4gKiDmiJDlip/lkI7oh6rliqjliLfmlrDlrqHmibnpk77liJfooajnvJPlrZjjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZURlbGV0ZUFwcHJvdmFsQ2hhaW4oKSB7XG4gIGNvbnN0IHFjID0gdXNlUXVlcnlDbGllbnQoKTtcbiAgcmV0dXJuIHVzZU11dGF0aW9uKHtcbiAgICBtdXRhdGlvbkZuOiBhc3luYyAoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgYXdhaXQgYXBpLmRlbGV0ZShgL2FwcHJvdmFsLWNoYWlucy8ke2lkfWApO1xuICAgIH0sXG4gICAgb25TdWNjZXNzOiAoKSA9PiBxYy5pbnZhbGlkYXRlUXVlcmllcyh7IHF1ZXJ5S2V5OiBbJ2FwcHJvdmFsLWNoYWlucyddIH0pLFxuICB9KTtcbn1cblxuLyoqXG4gKiDmj5DkuqTlt6XljZXpqozmlLZcbiAqXG4gKiDlsIYgSW5Qcm9ncmVzcyDnirbmgIHnmoTlt6XljZXmj5DkuqTov5vlhaXlrqHmibnmtYHnqIvvvIxcbiAqIOaIkOWKn+WQjuWIt+aWsOW3peWNleivpuaDheWSjOWIl+ihqOe8k+WtmOOAglxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlU3VibWl0V29ya09yZGVyKCkge1xuICBjb25zdCBxYyA9IHVzZVF1ZXJ5Q2xpZW50KCk7XG4gIHJldHVybiB1c2VNdXRhdGlvbih7XG4gICAgLy8g5o+Q5Lqk6aqM5pS25LiO5a6M5oiQ5bel5Y2V5YWx5LqrIENvbXBsZXRlV29ya09yZGVyUmVxdWVzdO+8iOaQuuW4piByZXNvbHV0aW9uL2V4ZWN1dGlvblJlcG9ydC9yZXF1aXJlZFBhcnRz77yJ44CCXG4gICAgLy8g5Y6fIHVzZVN1Ym1pdFdvcmtPcmRlciDlj6rkvKAgaWQg5LiN5LygIGJvZHnvvIzlkI7nq68gU3VibWl0QXN5bmMg5YaZ5YWl55qEIGV4ZWN1dGlvblJlcG9ydC9yZXF1aXJlZFBhcnRzIOawuOi/nOS4uuepulxuICAgIC8vIOKGkiDnn6Xor4bmsonmt4AgRmF1bHRDYXNlLlNvbHV0aW9uL1BhcnRzVXNlZCDmlbDmja7mupDnvLrlpLHvvIjlm57lvZIgIzI1Mu+8ieOAgueOsOS4juWujOaIkOW3peWNleWFpeWPo+S4gOiHtOmAj+S8oOivt+axguS9k+OAglxuICAgIG11dGF0aW9uRm46IGFzeW5jICh7IGlkLCAuLi5yZXEgfTogQ29tcGxldGVXb3JrT3JkZXJSZXF1ZXN0ICYgeyBpZDogc3RyaW5nIH0pID0+IHtcbiAgICAgIGF3YWl0IGFwaS5wb3N0KGAvd29yay1vcmRlcnMvJHtpZH0vc3VibWl0YCwgcmVxKTtcbiAgICB9LFxuICAgIG9uU3VjY2VzczogKF8sIHZhcmlhYmxlcykgPT4ge1xuICAgICAgcWMuaW52YWxpZGF0ZVF1ZXJpZXMoeyBxdWVyeUtleTogWyd3b3JrLW9yZGVycycsIHZhcmlhYmxlcy5pZF0gfSk7XG4gICAgICBxYy5pbnZhbGlkYXRlUXVlcmllcyh7IHF1ZXJ5S2V5OiBbJ3dvcmstb3JkZXJzJ10gfSk7XG4gICAgfSxcbiAgfSk7XG59XG5cbi8qKlxuICog5a6h5om56YCa6L+HXG4gKlxuICog5b2T5YmN5a6h5om55q2l6aqk6YCa6L+H77yM5oiQ5Yqf5ZCO5Yi35paw5a6h5om56K6w5b2V5ZKM5bel5Y2V57yT5a2Y44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VBcHByb3ZlV29ya09yZGVyKCkge1xuICBjb25zdCBxYyA9IHVzZVF1ZXJ5Q2xpZW50KCk7XG4gIHJldHVybiB1c2VNdXRhdGlvbih7XG4gICAgbXV0YXRpb25GbjogYXN5bmMgKHsgaWQsIGNvbW1lbnQgfTogeyBpZDogc3RyaW5nOyBjb21tZW50Pzogc3RyaW5nIH0pID0+IHtcbiAgICAgIGF3YWl0IGFwaS5wb3N0KGAvd29yay1vcmRlcnMvJHtpZH0vYXBwcm92ZWAsIHsgY29tbWVudCB9KTtcbiAgICB9LFxuICAgIG9uU3VjY2VzczogKF8sIHsgaWQgfSkgPT4ge1xuICAgICAgcWMuaW52YWxpZGF0ZVF1ZXJpZXMoeyBxdWVyeUtleTogWyd3b3JrLW9yZGVycycsIGlkLCAnYXBwcm92YWxzJ10gfSk7XG4gICAgICBxYy5pbnZhbGlkYXRlUXVlcmllcyh7IHF1ZXJ5S2V5OiBbJ3dvcmstb3JkZXJzJywgaWRdIH0pO1xuICAgICAgcWMuaW52YWxpZGF0ZVF1ZXJpZXMoeyBxdWVyeUtleTogWyd3b3JrLW9yZGVycyddIH0pO1xuICAgIH0sXG4gIH0pO1xufVxuXG4vKipcbiAqIOWuoeaJuemps+WbnlxuICpcbiAqIOW9k+WJjeWuoeaJueatpemqpOmps+Wbnu+8jOWPr+mZhOmps+WbnuaEj+inge+8jFxuICog5oiQ5Yqf5ZCO5Yi35paw5a6h5om56K6w5b2V5ZKM5bel5Y2V57yT5a2Y44CCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VSZWplY3RBcHByb3ZhbCgpIHtcbiAgY29uc3QgcWMgPSB1c2VRdWVyeUNsaWVudCgpO1xuICByZXR1cm4gdXNlTXV0YXRpb24oe1xuICAgIG11dGF0aW9uRm46IGFzeW5jICh7IGlkLCBjb21tZW50IH06IHsgaWQ6IHN0cmluZzsgY29tbWVudD86IHN0cmluZyB9KSA9PiB7XG4gICAgICBhd2FpdCBhcGkucG9zdChgL3dvcmstb3JkZXJzLyR7aWR9L3JlamVjdC1hcHByb3ZhbGAsIHsgY29tbWVudCB9KTtcbiAgICB9LFxuICAgIG9uU3VjY2VzczogKF8sIHsgaWQgfSkgPT4ge1xuICAgICAgcWMuaW52YWxpZGF0ZVF1ZXJpZXMoeyBxdWVyeUtleTogWyd3b3JrLW9yZGVycycsIGlkLCAnYXBwcm92YWxzJ10gfSk7XG4gICAgICBxYy5pbnZhbGlkYXRlUXVlcmllcyh7IHF1ZXJ5S2V5OiBbJ3dvcmstb3JkZXJzJywgaWRdIH0pO1xuICAgICAgcWMuaW52YWxpZGF0ZVF1ZXJpZXMoeyBxdWVyeUtleTogWyd3b3JrLW9yZGVycyddIH0pO1xuICAgIH0sXG4gIH0pO1xufVxuIl19