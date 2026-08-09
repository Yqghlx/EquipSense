import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/settings/UserManagementPanel.tsx");const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport13_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport13_react_jsxDevRuntime["Fragment"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=1d2f6f90";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=1d2f6f90";
import { Plus, Trash2, Search, UserCog } from "/node_modules/.vite/deps/lucide-react.js?v=1d2f6f90";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/src/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "/src/components/ui/table.tsx";
import { Input } from "/src/components/ui/input.tsx";
import { Button } from "/src/components/ui/button.tsx";
import { Badge } from "/src/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "/src/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "/src/components/ui/select.tsx";
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser, useChangeUserRole } from "/src/hooks/useUsers.ts";
import { UserFormDialog } from "/src/components/user/UserFormDialog.tsx";
import { formatDate } from "/src/lib/utils.ts";
var _jsxFileName = "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/UserManagementPanel.tsx";
import __vite__cjsImport13_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1d2f6f90";
var _s = $RefreshSig$();
/**
* 用户管理面板
*
* 展示用户列表，支持创建、编辑、停用用户，变更角色。
* 对应后端 /api/v1/admin/users 端点。
*/
export function UserManagementPanel() {
	_s();
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const [keyword, setKeyword] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [formOpen, setFormOpen] = useState(false);
	const [editingUser, setEditingUser] = useState(null);
	const [deactivateTarget, setDeactivateTarget] = useState(null);
	const [roleChangeTarget, setRoleChangeTarget] = useState(null);
	const [newRole, setNewRole] = useState("");
	const { data, isLoading } = useUsers({
		page,
		pageSize: 20,
		keyword: keyword || undefined
	});
	const createUser = useCreateUser();
	const updateUser = useUpdateUser();
	const deactivateUser = useDeactivateUser();
	const changeUserRole = useChangeUserRole();
	/** 角色中文标签映射 */
	const roleLabels = {
		SystemAdmin: t("settings.role.systemAdmin"),
		MaintenanceLead: t("settings.role.maintenanceLead"),
		Technician: t("settings.role.technician"),
		Operator: t("settings.role.operator"),
		Viewer: t("settings.role.viewer")
	};
	/** 搜索处理：按回车或点击搜索按钮触发 */
	const handleSearch = () => {
		setKeyword(searchInput);
		setPage(1);
	};
	/** 创建/编辑用户提交 */
	const handleFormSubmit = (payload) => {
		if (editingUser) {
			updateUser.mutate({
				id: editingUser.id,
				...payload
			}, { onSuccess: () => setFormOpen(false) });
		} else {
			createUser.mutate(payload, { onSuccess: () => setFormOpen(false) });
		}
	};
	/** 打开编辑对话框 */
	const openEdit = (user) => {
		setEditingUser(user);
		setFormOpen(true);
	};
	/** 打开创建对话框 */
	const openCreate = () => {
		setEditingUser(null);
		setFormOpen(true);
	};
	/** 确认停用用户 */
	const confirmDeactivate = () => {
		if (deactivateTarget) {
			deactivateUser.mutate(deactivateTarget.id, { onSuccess: () => setDeactivateTarget(null) });
		}
	};
	/** 确认变更角色 */
	const confirmRoleChange = () => {
		if (roleChangeTarget && newRole) {
			changeUserRole.mutate({
				id: roleChangeTarget.id,
				role: newRole
			}, { onSuccess: () => setRoleChangeTarget(null) });
		}
	};
	const isSubmitting = createUser.isPending || updateUser.isPending;
	return /* @__PURE__ */ _jsxDEV(_Fragment, { children: [
		/* @__PURE__ */ _jsxDEV(Card, { children: [/* @__PURE__ */ _jsxDEV(CardHeader, { children: /* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV(CardTitle, { children: t("settings.users") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 119,
				columnNumber: 15
			}, this), /* @__PURE__ */ _jsxDEV(CardDescription, { children: t("settings.manageUserAccounts") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 120,
				columnNumber: 15
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 118,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(Button, {
				size: "sm",
				onClick: openCreate,
				children: [/* @__PURE__ */ _jsxDEV(Plus, { className: "mr-1 h-4 w-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 123,
					columnNumber: 15
				}, this), t("settings.user.createUser")]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 122,
				columnNumber: 13
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 117,
			columnNumber: 11
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 116,
			columnNumber: 9
		}, this), /* @__PURE__ */ _jsxDEV(CardContent, { children: [/* @__PURE__ */ _jsxDEV("div", {
			className: "flex gap-2 mb-4",
			children: [/* @__PURE__ */ _jsxDEV(Input, {
				className: "max-w-xs",
				placeholder: t("settings.user.searchPlaceholder"),
				value: searchInput,
				onChange: (e) => setSearchInput(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") handleSearch();
				}
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 131,
				columnNumber: 13
			}, this), /* @__PURE__ */ _jsxDEV(Button, {
				variant: "outline",
				size: "sm",
				onClick: handleSearch,
				children: /* @__PURE__ */ _jsxDEV(Search, { className: "h-4 w-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 139,
					columnNumber: 15
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 138,
				columnNumber: 13
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 130,
			columnNumber: 11
		}, this), isLoading ? /* @__PURE__ */ _jsxDEV("p", {
			className: "py-8 text-center text-muted-foreground",
			children: t("common.loading")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 145,
			columnNumber: 13
		}, this) : /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV(Table, { children: [/* @__PURE__ */ _jsxDEV(TableHeader, { children: /* @__PURE__ */ _jsxDEV(TableRow, { children: [
			/* @__PURE__ */ _jsxDEV(TableHead, { children: t("settings.username") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 151,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ _jsxDEV(TableHead, { children: t("settings.user.displayName") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 152,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ _jsxDEV(TableHead, { children: t("settings.roleLabel") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 153,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ _jsxDEV(TableHead, { children: t("settings.user.contact") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 154,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.status") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 155,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.createdAt") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 156,
				columnNumber: 21
			}, this),
			/* @__PURE__ */ _jsxDEV(TableHead, { children: t("common.actions") }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 157,
				columnNumber: 21
			}, this)
		] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 150,
			columnNumber: 19
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 149,
			columnNumber: 17
		}, this), /* @__PURE__ */ _jsxDEV(TableBody, { children: data?.items.length === 0 ? /* @__PURE__ */ _jsxDEV(TableRow, { children: /* @__PURE__ */ _jsxDEV(TableCell, {
			colSpan: 7,
			className: "text-center text-muted-foreground",
			children: t("common.noData")
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 163,
			columnNumber: 23
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 162,
			columnNumber: 21
		}, this) : data?.items.map((user) => /* @__PURE__ */ _jsxDEV(TableRow, { children: [
			/* @__PURE__ */ _jsxDEV(TableCell, {
				className: "font-medium",
				children: user.username
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 170,
				columnNumber: 25
			}, this),
			/* @__PURE__ */ _jsxDEV(TableCell, { children: user.displayName || "—" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 171,
				columnNumber: 25
			}, this),
			/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(Badge, {
				variant: "outline",
				children: roleLabels[user.role] ?? user.role
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 173,
				columnNumber: 27
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 172,
				columnNumber: 25
			}, this),
			/* @__PURE__ */ _jsxDEV(TableCell, {
				className: "text-sm text-muted-foreground",
				children: user.email || user.phone || "—"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 175,
				columnNumber: 25
			}, this),
			/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV(Badge, {
				variant: user.isActive ? "default" : "secondary",
				children: user.isActive ? t("common.enabled") : t("common.disabled")
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 179,
				columnNumber: 27
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 178,
				columnNumber: 25
			}, this),
			/* @__PURE__ */ _jsxDEV(TableCell, {
				className: "text-sm text-muted-foreground",
				children: formatDate(user.createdAt)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 183,
				columnNumber: 25
			}, this),
			/* @__PURE__ */ _jsxDEV(TableCell, { children: /* @__PURE__ */ _jsxDEV("div", {
				className: "flex gap-1",
				children: [
					/* @__PURE__ */ _jsxDEV(Button, {
						variant: "ghost",
						size: "sm",
						className: "h-8",
						onClick: () => openEdit(user),
						title: t("common.edit"),
						children: /* @__PURE__ */ _jsxDEV(UserCog, { className: "h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 195,
							columnNumber: 31
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 188,
						columnNumber: 29
					}, this),
					/* @__PURE__ */ _jsxDEV(Button, {
						variant: "ghost",
						size: "sm",
						className: "h-8",
						onClick: () => {
							setRoleChangeTarget(user);
							setNewRole(user.role);
						},
						title: t("settings.user.changeRole"),
						children: /* @__PURE__ */ _jsxDEV("svg", {
							xmlns: "http://www.w3.org/2000/svg",
							className: "h-4 w-4",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "2",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							children: [
								/* @__PURE__ */ _jsxDEV("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 204,
									columnNumber: 206
								}, this),
								/* @__PURE__ */ _jsxDEV("circle", {
									cx: "9",
									cy: "7",
									r: "4"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 204,
									columnNumber: 259
								}, this),
								/* @__PURE__ */ _jsxDEV("path", { d: "m16 11 2 2 4-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 204,
									columnNumber: 288
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 204,
							columnNumber: 31
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 197,
						columnNumber: 29
					}, this),
					user.isActive && /* @__PURE__ */ _jsxDEV(Button, {
						variant: "ghost",
						size: "sm",
						className: "h-8 text-destructive hover:text-destructive",
						onClick: () => setDeactivateTarget(user),
						title: t("settings.user.deactivate"),
						children: /* @__PURE__ */ _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 214,
							columnNumber: 33
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 207,
						columnNumber: 31
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 187,
				columnNumber: 27
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 186,
				columnNumber: 25
			}, this)
		] }, user.id, true, {
			fileName: _jsxFileName,
			lineNumber: 169,
			columnNumber: 23
		}, this)) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 160,
			columnNumber: 17
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 148,
			columnNumber: 15
		}, this), data && data.total > 20 && /* @__PURE__ */ _jsxDEV("div", {
			className: "flex items-center justify-between text-sm text-muted-foreground mt-4",
			children: [/* @__PURE__ */ _jsxDEV("span", { children: t("common.totalItems", { count: data.total }) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 228,
				columnNumber: 19
			}, this), /* @__PURE__ */ _jsxDEV("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ _jsxDEV(Button, {
					variant: "outline",
					size: "sm",
					disabled: page <= 1,
					onClick: () => setPage(page - 1),
					children: t("common.previous")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 230,
					columnNumber: 21
				}, this), /* @__PURE__ */ _jsxDEV(Button, {
					variant: "outline",
					size: "sm",
					disabled: page * 20 >= data.total,
					onClick: () => setPage(page + 1),
					children: t("common.next")
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 233,
					columnNumber: 21
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 229,
				columnNumber: 19
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 227,
			columnNumber: 17
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 147,
			columnNumber: 13
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 128,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 115,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV(UserFormDialog, {
			open: formOpen,
			onClose: () => setFormOpen(false),
			user: editingUser,
			onSubmit: handleFormSubmit,
			submitting: isSubmitting
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 245,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV(Dialog, {
			open: !!deactivateTarget,
			onOpenChange: (v) => {
				if (!v) setDeactivateTarget(null);
			},
			children: /* @__PURE__ */ _jsxDEV(DialogContent, {
				className: "max-w-sm",
				children: [/* @__PURE__ */ _jsxDEV(DialogHeader, { children: [/* @__PURE__ */ _jsxDEV(DialogTitle, { children: t("settings.user.deactivate") }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 257,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV(DialogDescription, { children: t("settings.user.deactivateConfirm", { username: deactivateTarget?.username }) }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 258,
					columnNumber: 13
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 256,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV(DialogFooter, {
					className: "gap-2",
					children: [/* @__PURE__ */ _jsxDEV(Button, {
						variant: "outline",
						onClick: () => setDeactivateTarget(null),
						children: t("common.cancel")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 263,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV(Button, {
						variant: "destructive",
						onClick: confirmDeactivate,
						disabled: deactivateUser.isPending,
						children: deactivateUser.isPending ? t("common.loading") : t("common.confirm")
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 264,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 262,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 255,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 254,
			columnNumber: 7
		}, this),
		/* @__PURE__ */ _jsxDEV(Dialog, {
			open: !!roleChangeTarget,
			onOpenChange: (v) => {
				if (!v) setRoleChangeTarget(null);
			},
			children: /* @__PURE__ */ _jsxDEV(DialogContent, {
				className: "max-w-sm",
				children: [
					/* @__PURE__ */ _jsxDEV(DialogHeader, { children: [/* @__PURE__ */ _jsxDEV(DialogTitle, { children: t("settings.user.changeRole") }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 275,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV(DialogDescription, { children: t("settings.user.changeRoleDesc", { username: roleChangeTarget?.username }) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 276,
						columnNumber: 13
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 274,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "space-y-4",
						children: /* @__PURE__ */ _jsxDEV(Select, {
							value: newRole,
							onValueChange: (v) => {
								if (v) setNewRole(v);
							},
							children: [/* @__PURE__ */ _jsxDEV(SelectTrigger, { children: /* @__PURE__ */ _jsxDEV(SelectValue, {}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 282,
								columnNumber: 30
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 282,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV(SelectContent, { children: Object.entries(roleLabels).map(([value, label]) => /* @__PURE__ */ _jsxDEV(SelectItem, {
								value,
								children: label
							}, value, false, {
								fileName: _jsxFileName,
								lineNumber: 285,
								columnNumber: 19
							}, this)) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 283,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 281,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 280,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV(DialogFooter, {
						className: "gap-2",
						children: [/* @__PURE__ */ _jsxDEV(Button, {
							variant: "outline",
							onClick: () => setRoleChangeTarget(null),
							children: t("common.cancel")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 291,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV(Button, {
							onClick: confirmRoleChange,
							disabled: changeUserRole.isPending || !newRole,
							children: changeUserRole.isPending ? t("common.loading") : t("common.confirm")
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 292,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 290,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 273,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 272,
			columnNumber: 7
		}, this)
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 114,
		columnNumber: 5
	}, this);
}
_s(UserManagementPanel, "9ADY46WSwwFqPgmuNlT0nJGHkRc=", false, function() {
	return [
		useTranslation,
		useUsers,
		useCreateUser,
		useUpdateUser,
		useDeactivateUser,
		useChangeUserRole
	];
});
_c = UserManagementPanel;
var _c;
$RefreshReg$(_c, "UserManagementPanel");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/components/settings/UserManagementPanel.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/UserManagementPanel.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/UserManagementPanel.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/Users/yqgmac/yqg/project/EquipSense/frontend/src/components/settings/UserManagementPanel.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QUc7aUJBQXRFLENBQ0Usd0JBQUMsZUFBRCxZQUFlLHdCQUFDLGFBQUQsQ0FBYzs7OztnQkFBZ0I7Ozs7aUJBQzdDLHdCQUFDLGVBQUQsWUFDRyxPQUFPLFFBQVEsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sV0FDdkMsd0JBQUMsWUFBRDtRQUErQjtrQkFBUTtPQUFrQixHQUF4Qzs7OztjQUF3QyxDQUMxRCxFQUNZOzs7O2VBQ1Q7Ozs7OztLQUNMOzs7OztLQUNMLHdCQUFDLGNBQUQ7TUFBYyxXQUFVO2dCQUF4QixDQUNFLHdCQUFDLFFBQUQ7T0FBUSxTQUFRO09BQVUsZUFBZSxvQkFBb0IsSUFBSTtpQkFBSSxFQUFFLGVBQWU7TUFBVTs7OztnQkFDaEcsd0JBQUMsUUFBRDtPQUFRLFNBQVM7T0FBbUIsVUFBVSxlQUFlLGFBQWEsQ0FBQztpQkFDeEUsZUFBZSxZQUFZLEVBQUUsZ0JBQWdCLElBQUksRUFBRSxnQkFBZ0I7TUFDOUQ7Ozs7Y0FDSTs7Ozs7O0lBQ0Q7Ozs7OztFQUNUOzs7OztDQUNSOzs7OztBQUVOIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIlVzZXJNYW5hZ2VtZW50UGFuZWwudHN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IFBsdXMsIFRyYXNoMiwgU2VhcmNoLCBVc2VyQ29nIH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50LCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUsIENhcmREZXNjcmlwdGlvbiB9IGZyb20gJy4uL3VpL2NhcmQnO1xuaW1wb3J0IHsgVGFibGUsIFRhYmxlQm9keSwgVGFibGVDZWxsLCBUYWJsZUhlYWQsIFRhYmxlSGVhZGVyLCBUYWJsZVJvdyB9IGZyb20gJy4uL3VpL3RhYmxlJztcbmltcG9ydCB7IElucHV0IH0gZnJvbSAnLi4vdWkvaW5wdXQnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAnLi4vdWkvYnV0dG9uJztcbmltcG9ydCB7IEJhZGdlIH0gZnJvbSAnLi4vdWkvYmFkZ2UnO1xuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dDb250ZW50LCBEaWFsb2dIZWFkZXIsIERpYWxvZ1RpdGxlLCBEaWFsb2dEZXNjcmlwdGlvbiwgRGlhbG9nRm9vdGVyIH0gZnJvbSAnLi4vdWkvZGlhbG9nJztcbmltcG9ydCB7XG4gIFNlbGVjdCxcbiAgU2VsZWN0Q29udGVudCxcbiAgU2VsZWN0SXRlbSxcbiAgU2VsZWN0VHJpZ2dlcixcbiAgU2VsZWN0VmFsdWUsXG59IGZyb20gJy4uL3VpL3NlbGVjdCc7XG5pbXBvcnQge1xuICB1c2VVc2VycyxcbiAgdXNlQ3JlYXRlVXNlcixcbiAgdXNlVXBkYXRlVXNlcixcbiAgdXNlRGVhY3RpdmF0ZVVzZXIsXG4gIHVzZUNoYW5nZVVzZXJSb2xlLFxuICB0eXBlIFVzZXJJdGVtLFxuICB0eXBlIENyZWF0ZVVzZXJQYXlsb2FkLFxuICB0eXBlIFVwZGF0ZVVzZXJQYXlsb2FkLFxufSBmcm9tICcuLi8uLi9ob29rcy91c2VVc2Vycyc7XG5pbXBvcnQgeyBVc2VyRm9ybURpYWxvZyB9IGZyb20gJy4uL3VzZXIvVXNlckZvcm1EaWFsb2cnO1xuaW1wb3J0IHsgZm9ybWF0RGF0ZSB9IGZyb20gJy4uLy4uL2xpYi91dGlscyc7XG5cbi8qKlxuICog55So5oi3566h55CG6Z2i5p2/XG4gKlxuICog5bGV56S655So5oi35YiX6KGo77yM5pSv5oyB5Yib5bu644CB57yW6L6R44CB5YGc55So55So5oi377yM5Y+Y5pu06KeS6Imy44CCXG4gKiDlr7nlupTlkI7nq68gL2FwaS92MS9hZG1pbi91c2VycyDnq6/ngrnjgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFVzZXJNYW5hZ2VtZW50UGFuZWwoKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3BhZ2UsIHNldFBhZ2VdID0gdXNlU3RhdGUoMSk7XG4gIGNvbnN0IFtrZXl3b3JkLCBzZXRLZXl3b3JkXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3NlYXJjaElucHV0LCBzZXRTZWFyY2hJbnB1dF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtmb3JtT3Blbiwgc2V0Rm9ybU9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbZWRpdGluZ1VzZXIsIHNldEVkaXRpbmdVc2VyXSA9IHVzZVN0YXRlPFVzZXJJdGVtIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtkZWFjdGl2YXRlVGFyZ2V0LCBzZXREZWFjdGl2YXRlVGFyZ2V0XSA9IHVzZVN0YXRlPFVzZXJJdGVtIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtyb2xlQ2hhbmdlVGFyZ2V0LCBzZXRSb2xlQ2hhbmdlVGFyZ2V0XSA9IHVzZVN0YXRlPFVzZXJJdGVtIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtuZXdSb2xlLCBzZXROZXdSb2xlXSA9IHVzZVN0YXRlKCcnKTtcblxuICBjb25zdCB7IGRhdGEsIGlzTG9hZGluZyB9ID0gdXNlVXNlcnMoeyBwYWdlLCBwYWdlU2l6ZTogMjAsIGtleXdvcmQ6IGtleXdvcmQgfHwgdW5kZWZpbmVkIH0pO1xuICBjb25zdCBjcmVhdGVVc2VyID0gdXNlQ3JlYXRlVXNlcigpO1xuICBjb25zdCB1cGRhdGVVc2VyID0gdXNlVXBkYXRlVXNlcigpO1xuICBjb25zdCBkZWFjdGl2YXRlVXNlciA9IHVzZURlYWN0aXZhdGVVc2VyKCk7XG4gIGNvbnN0IGNoYW5nZVVzZXJSb2xlID0gdXNlQ2hhbmdlVXNlclJvbGUoKTtcblxuICAvKiog6KeS6Imy5Lit5paH5qCH562+5pig5bCEICovXG4gIGNvbnN0IHJvbGVMYWJlbHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgU3lzdGVtQWRtaW46IHQoJ3NldHRpbmdzLnJvbGUuc3lzdGVtQWRtaW4nKSxcbiAgICBNYWludGVuYW5jZUxlYWQ6IHQoJ3NldHRpbmdzLnJvbGUubWFpbnRlbmFuY2VMZWFkJyksXG4gICAgVGVjaG5pY2lhbjogdCgnc2V0dGluZ3Mucm9sZS50ZWNobmljaWFuJyksXG4gICAgT3BlcmF0b3I6IHQoJ3NldHRpbmdzLnJvbGUub3BlcmF0b3InKSxcbiAgICBWaWV3ZXI6IHQoJ3NldHRpbmdzLnJvbGUudmlld2VyJyksXG4gIH07XG5cbiAgLyoqIOaQnOe0ouWkhOeQhu+8muaMieWbnui9puaIlueCueWHu+aQnOe0ouaMiemSruinpuWPkSAqL1xuICBjb25zdCBoYW5kbGVTZWFyY2ggPSAoKSA9PiB7XG4gICAgc2V0S2V5d29yZChzZWFyY2hJbnB1dCk7XG4gICAgc2V0UGFnZSgxKTtcbiAgfTtcblxuICAvKiog5Yib5bu6L+e8lui+keeUqOaIt+aPkOS6pCAqL1xuICBjb25zdCBoYW5kbGVGb3JtU3VibWl0ID0gKHBheWxvYWQ6IENyZWF0ZVVzZXJQYXlsb2FkIHwgVXBkYXRlVXNlclBheWxvYWQpID0+IHtcbiAgICBpZiAoZWRpdGluZ1VzZXIpIHtcbiAgICAgIHVwZGF0ZVVzZXIubXV0YXRlKHsgaWQ6IGVkaXRpbmdVc2VyLmlkLCAuLi5wYXlsb2FkIH0gYXMgVXBkYXRlVXNlclBheWxvYWQgJiB7IGlkOiBzdHJpbmcgfSwge1xuICAgICAgICBvblN1Y2Nlc3M6ICgpID0+IHNldEZvcm1PcGVuKGZhbHNlKSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjcmVhdGVVc2VyLm11dGF0ZShwYXlsb2FkIGFzIENyZWF0ZVVzZXJQYXlsb2FkLCB7XG4gICAgICAgIG9uU3VjY2VzczogKCkgPT4gc2V0Rm9ybU9wZW4oZmFsc2UpLFxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiDmiZPlvIDnvJbovpHlr7nor53moYYgKi9cbiAgY29uc3Qgb3BlbkVkaXQgPSAodXNlcjogVXNlckl0ZW0pID0+IHtcbiAgICBzZXRFZGl0aW5nVXNlcih1c2VyKTtcbiAgICBzZXRGb3JtT3Blbih0cnVlKTtcbiAgfTtcblxuICAvKiog5omT5byA5Yib5bu65a+56K+d5qGGICovXG4gIGNvbnN0IG9wZW5DcmVhdGUgPSAoKSA9PiB7XG4gICAgc2V0RWRpdGluZ1VzZXIobnVsbCk7XG4gICAgc2V0Rm9ybU9wZW4odHJ1ZSk7XG4gIH07XG5cbiAgLyoqIOehruiupOWBnOeUqOeUqOaItyAqL1xuICBjb25zdCBjb25maXJtRGVhY3RpdmF0ZSA9ICgpID0+IHtcbiAgICBpZiAoZGVhY3RpdmF0ZVRhcmdldCkge1xuICAgICAgZGVhY3RpdmF0ZVVzZXIubXV0YXRlKGRlYWN0aXZhdGVUYXJnZXQuaWQsIHtcbiAgICAgICAgb25TdWNjZXNzOiAoKSA9PiBzZXREZWFjdGl2YXRlVGFyZ2V0KG51bGwpLFxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiDnoa7orqTlj5jmm7Top5LoibIgKi9cbiAgY29uc3QgY29uZmlybVJvbGVDaGFuZ2UgPSAoKSA9PiB7XG4gICAgaWYgKHJvbGVDaGFuZ2VUYXJnZXQgJiYgbmV3Um9sZSkge1xuICAgICAgY2hhbmdlVXNlclJvbGUubXV0YXRlKHsgaWQ6IHJvbGVDaGFuZ2VUYXJnZXQuaWQsIHJvbGU6IG5ld1JvbGUgfSwge1xuICAgICAgICBvblN1Y2Nlc3M6ICgpID0+IHNldFJvbGVDaGFuZ2VUYXJnZXQobnVsbCksXG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaXNTdWJtaXR0aW5nID0gY3JlYXRlVXNlci5pc1BlbmRpbmcgfHwgdXBkYXRlVXNlci5pc1BlbmRpbmc7XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPENhcmQ+XG4gICAgICAgIDxDYXJkSGVhZGVyPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8Q2FyZFRpdGxlPnt0KCdzZXR0aW5ncy51c2VycycpfTwvQ2FyZFRpdGxlPlxuICAgICAgICAgICAgICA8Q2FyZERlc2NyaXB0aW9uPnt0KCdzZXR0aW5ncy5tYW5hZ2VVc2VyQWNjb3VudHMnKX08L0NhcmREZXNjcmlwdGlvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPEJ1dHRvbiBzaXplPVwic21cIiBvbkNsaWNrPXtvcGVuQ3JlYXRlfT5cbiAgICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwibXItMSBoLTQgdy00XCIgLz5cbiAgICAgICAgICAgICAge3QoJ3NldHRpbmdzLnVzZXIuY3JlYXRlVXNlcicpfVxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvQ2FyZEhlYWRlcj5cbiAgICAgICAgPENhcmRDb250ZW50PlxuICAgICAgICAgIHsvKiDmkJzntKLmoI8gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yIG1iLTRcIj5cbiAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJtYXgtdy14c1wiXG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt0KCdzZXR0aW5ncy51c2VyLnNlYXJjaFBsYWNlaG9sZGVyJyl9XG4gICAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hJbnB1dH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRTZWFyY2hJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHsgaWYgKGUua2V5ID09PSAnRW50ZXInKSBoYW5kbGVTZWFyY2goKTsgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgc2l6ZT1cInNtXCIgb25DbGljaz17aGFuZGxlU2VhcmNofT5cbiAgICAgICAgICAgICAgPFNlYXJjaCBjbGFzc05hbWU9XCJoLTQgdy00XCIgLz5cbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgey8qIOeUqOaIt+WIl+ihqCAqL31cbiAgICAgICAgICB7aXNMb2FkaW5nID8gKFxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwicHktOCB0ZXh0LWNlbnRlciB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57dCgnY29tbW9uLmxvYWRpbmcnKX08L3A+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgIDxUYWJsZT5cbiAgICAgICAgICAgICAgICA8VGFibGVIZWFkZXI+XG4gICAgICAgICAgICAgICAgICA8VGFibGVSb3c+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ3NldHRpbmdzLnVzZXJuYW1lJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ3NldHRpbmdzLnVzZXIuZGlzcGxheU5hbWUnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnc2V0dGluZ3Mucm9sZUxhYmVsJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ3NldHRpbmdzLnVzZXIuY29udGFjdCcpfTwvVGFibGVIZWFkPlxuICAgICAgICAgICAgICAgICAgICA8VGFibGVIZWFkPnt0KCdjb21tb24uc3RhdHVzJyl9PC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICAgICAgICAgIDxUYWJsZUhlYWQ+e3QoJ2NvbW1vbi5jcmVhdGVkQXQnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD57dCgnY29tbW9uLmFjdGlvbnMnKX08L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgIDwvVGFibGVSb3c+XG4gICAgICAgICAgICAgICAgPC9UYWJsZUhlYWRlcj5cbiAgICAgICAgICAgICAgICA8VGFibGVCb2R5PlxuICAgICAgICAgICAgICAgICAge2RhdGE/Lml0ZW1zLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgY29sU3Bhbj17N30gY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dCgnY29tbW9uLm5vRGF0YScpfVxuICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgZGF0YT8uaXRlbXMubWFwKCh1c2VyKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93IGtleT17dXNlci5pZH0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsIGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtXCI+e3VzZXIudXNlcm5hbWV9PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPnt1c2VyLmRpc3BsYXlOYW1lIHx8ICfigJQnfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPEJhZGdlIHZhcmlhbnQ9XCJvdXRsaW5lXCI+e3JvbGVMYWJlbHNbdXNlci5yb2xlXSA/PyB1c2VyLnJvbGV9PC9CYWRnZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7dXNlci5lbWFpbCB8fCB1c2VyLnBob25lIHx8ICfigJQnfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD17dXNlci5pc0FjdGl2ZSA/ICdkZWZhdWx0JyA6ICdzZWNvbmRhcnknfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dXNlci5pc0FjdGl2ZSA/IHQoJ2NvbW1vbi5lbmFibGVkJykgOiB0KCdjb21tb24uZGlzYWJsZWQnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CYWRnZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0RGF0ZSh1c2VyLmNyZWF0ZWRBdCl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ9XCJnaG9zdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaC04XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9wZW5FZGl0KHVzZXIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3QoJ2NvbW1vbi5lZGl0Jyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFVzZXJDb2cgY2xhc3NOYW1lPVwiaC00IHctNFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFudD1cImdob3N0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoLThcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4geyBzZXRSb2xlQ2hhbmdlVGFyZ2V0KHVzZXIpOyBzZXROZXdSb2xlKHVzZXIucm9sZSk7IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17dCgnc2V0dGluZ3MudXNlci5jaGFuZ2VSb2xlJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3NOYW1lPVwiaC00IHctNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZVdpZHRoPVwiMlwiIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIj48cGF0aCBkPVwiTTE2IDIxdi0yYTQgNCAwIDAgMC00LTRINmE0IDQgMCAwIDAtNCA0djJcIi8+PGNpcmNsZSBjeD1cIjlcIiBjeT1cIjdcIiByPVwiNFwiLz48cGF0aCBkPVwibTE2IDExIDIgMiA0LTRcIi8+PC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3VzZXIuaXNBY3RpdmUgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50PVwiZ2hvc3RcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoLTggdGV4dC1kZXN0cnVjdGl2ZSBob3Zlcjp0ZXh0LWRlc3RydWN0aXZlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RGVhY3RpdmF0ZVRhcmdldCh1c2VyKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e3QoJ3NldHRpbmdzLnVzZXIuZGVhY3RpdmF0ZScpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VHJhc2gyIGNsYXNzTmFtZT1cImgtNCB3LTRcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L1RhYmxlQm9keT5cbiAgICAgICAgICAgICAgPC9UYWJsZT5cblxuICAgICAgICAgICAgICB7Lyog5YiG6aG1ICovfVxuICAgICAgICAgICAgICB7ZGF0YSAmJiBkYXRhLnRvdGFsID4gMjAgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTRcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuPnt0KCdjb21tb24udG90YWxJdGVtcycsIHsgY291bnQ6IGRhdGEudG90YWwgfSl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBzaXplPVwic21cIiBkaXNhYmxlZD17cGFnZSA8PSAxfSBvbkNsaWNrPXsoKSA9PiBzZXRQYWdlKHBhZ2UgLSAxKX0+XG4gICAgICAgICAgICAgICAgICAgICAge3QoJ2NvbW1vbi5wcmV2aW91cycpfVxuICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIHNpemU9XCJzbVwiIGRpc2FibGVkPXtwYWdlICogMjAgPj0gZGF0YS50b3RhbH0gb25DbGljaz17KCkgPT4gc2V0UGFnZShwYWdlICsgMSl9PlxuICAgICAgICAgICAgICAgICAgICAgIHt0KCdjb21tb24ubmV4dCcpfVxuICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9DYXJkQ29udGVudD5cbiAgICAgIDwvQ2FyZD5cblxuICAgICAgey8qIOWIm+W7ui/nvJbovpHnlKjmiLflr7nor53moYYgKi99XG4gICAgICA8VXNlckZvcm1EaWFsb2dcbiAgICAgICAgb3Blbj17Zm9ybU9wZW59XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldEZvcm1PcGVuKGZhbHNlKX1cbiAgICAgICAgdXNlcj17ZWRpdGluZ1VzZXJ9XG4gICAgICAgIG9uU3VibWl0PXtoYW5kbGVGb3JtU3VibWl0fVxuICAgICAgICBzdWJtaXR0aW5nPXtpc1N1Ym1pdHRpbmd9XG4gICAgICAvPlxuXG4gICAgICB7Lyog5YGc55So55So5oi356Gu6K6k5a+56K+d5qGGICovfVxuICAgICAgPERpYWxvZyBvcGVuPXshIWRlYWN0aXZhdGVUYXJnZXR9IG9uT3BlbkNoYW5nZT17KHYpID0+IHsgaWYgKCF2KSBzZXREZWFjdGl2YXRlVGFyZ2V0KG51bGwpOyB9fT5cbiAgICAgICAgPERpYWxvZ0NvbnRlbnQgY2xhc3NOYW1lPVwibWF4LXctc21cIj5cbiAgICAgICAgICA8RGlhbG9nSGVhZGVyPlxuICAgICAgICAgICAgPERpYWxvZ1RpdGxlPnt0KCdzZXR0aW5ncy51c2VyLmRlYWN0aXZhdGUnKX08L0RpYWxvZ1RpdGxlPlxuICAgICAgICAgICAgPERpYWxvZ0Rlc2NyaXB0aW9uPlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MudXNlci5kZWFjdGl2YXRlQ29uZmlybScsIHsgdXNlcm5hbWU6IGRlYWN0aXZhdGVUYXJnZXQ/LnVzZXJuYW1lIH0pfVxuICAgICAgICAgICAgPC9EaWFsb2dEZXNjcmlwdGlvbj5cbiAgICAgICAgICA8L0RpYWxvZ0hlYWRlcj5cbiAgICAgICAgICA8RGlhbG9nRm9vdGVyIGNsYXNzTmFtZT1cImdhcC0yXCI+XG4gICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJvdXRsaW5lXCIgb25DbGljaz17KCkgPT4gc2V0RGVhY3RpdmF0ZVRhcmdldChudWxsKX0+e3QoJ2NvbW1vbi5jYW5jZWwnKX08L0J1dHRvbj5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cImRlc3RydWN0aXZlXCIgb25DbGljaz17Y29uZmlybURlYWN0aXZhdGV9IGRpc2FibGVkPXtkZWFjdGl2YXRlVXNlci5pc1BlbmRpbmd9PlxuICAgICAgICAgICAgICB7ZGVhY3RpdmF0ZVVzZXIuaXNQZW5kaW5nID8gdCgnY29tbW9uLmxvYWRpbmcnKSA6IHQoJ2NvbW1vbi5jb25maXJtJyl9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICA8L0RpYWxvZ0Zvb3Rlcj5cbiAgICAgICAgPC9EaWFsb2dDb250ZW50PlxuICAgICAgPC9EaWFsb2c+XG5cbiAgICAgIHsvKiDlj5jmm7Top5LoibLlr7nor53moYYgKi99XG4gICAgICA8RGlhbG9nIG9wZW49eyEhcm9sZUNoYW5nZVRhcmdldH0gb25PcGVuQ2hhbmdlPXsodikgPT4geyBpZiAoIXYpIHNldFJvbGVDaGFuZ2VUYXJnZXQobnVsbCk7IH19PlxuICAgICAgICA8RGlhbG9nQ29udGVudCBjbGFzc05hbWU9XCJtYXgtdy1zbVwiPlxuICAgICAgICAgIDxEaWFsb2dIZWFkZXI+XG4gICAgICAgICAgICA8RGlhbG9nVGl0bGU+e3QoJ3NldHRpbmdzLnVzZXIuY2hhbmdlUm9sZScpfTwvRGlhbG9nVGl0bGU+XG4gICAgICAgICAgICA8RGlhbG9nRGVzY3JpcHRpb24+XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy51c2VyLmNoYW5nZVJvbGVEZXNjJywgeyB1c2VybmFtZTogcm9sZUNoYW5nZVRhcmdldD8udXNlcm5hbWUgfSl9XG4gICAgICAgICAgICA8L0RpYWxvZ0Rlc2NyaXB0aW9uPlxuICAgICAgICAgIDwvRGlhbG9nSGVhZGVyPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgICA8U2VsZWN0IHZhbHVlPXtuZXdSb2xlfSBvblZhbHVlQ2hhbmdlPXsodikgPT4geyBpZiAodikgc2V0TmV3Um9sZSh2KTsgfX0+XG4gICAgICAgICAgICAgIDxTZWxlY3RUcmlnZ2VyPjxTZWxlY3RWYWx1ZSAvPjwvU2VsZWN0VHJpZ2dlcj5cbiAgICAgICAgICAgICAgPFNlbGVjdENvbnRlbnQ+XG4gICAgICAgICAgICAgICAge09iamVjdC5lbnRyaWVzKHJvbGVMYWJlbHMpLm1hcCgoW3ZhbHVlLCBsYWJlbF0pID0+IChcbiAgICAgICAgICAgICAgICAgIDxTZWxlY3RJdGVtIGtleT17dmFsdWV9IHZhbHVlPXt2YWx1ZX0+e2xhYmVsfTwvU2VsZWN0SXRlbT5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9TZWxlY3RDb250ZW50PlxuICAgICAgICAgICAgPC9TZWxlY3Q+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPERpYWxvZ0Zvb3RlciBjbGFzc05hbWU9XCJnYXAtMlwiPlxuICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiIG9uQ2xpY2s9eygpID0+IHNldFJvbGVDaGFuZ2VUYXJnZXQobnVsbCl9Pnt0KCdjb21tb24uY2FuY2VsJyl9PC9CdXR0b24+XG4gICAgICAgICAgICA8QnV0dG9uIG9uQ2xpY2s9e2NvbmZpcm1Sb2xlQ2hhbmdlfSBkaXNhYmxlZD17Y2hhbmdlVXNlclJvbGUuaXNQZW5kaW5nIHx8ICFuZXdSb2xlfT5cbiAgICAgICAgICAgICAge2NoYW5nZVVzZXJSb2xlLmlzUGVuZGluZyA/IHQoJ2NvbW1vbi5sb2FkaW5nJykgOiB0KCdjb21tb24uY29uZmlybScpfVxuICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgPC9EaWFsb2dGb290ZXI+XG4gICAgICAgIDwvRGlhbG9nQ29udGVudD5cbiAgICAgIDwvRGlhbG9nPlxuICAgIDwvPlxuICApO1xufVxuIl19