# FMEA Frontend CRUD Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 在 FMEA 页面补齐有权限用户的新建与编辑闭环，并提供一致、可访问的风险评分录入体验。

**Architecture:** FmeaPage 只管理列表、权限和弹窗状态；独立的 FmeaFormDialog 管理表单状态、校验和 create/update mutation。fmeaRisk 纯函数集中计算 RPN、校验评分和风险色阶，确保列表与表单预览使用同一规则。

**Tech Stack:** React 19、TypeScript strict、TanStack Query hooks、shadcn/ui、TailwindCSS、react-i18next、Vitest、Testing Library、user-event。

## Global Constraints

- 不新增第三方依赖，不新增后端 FMEA 端点；关联规则校验必须遵循后端已有的租户权限语义。
- 所有新增代码注释、测试说明、用户文案使用中文；英文界面文案必须同步维护。
- 文本请求字段提交前去除首尾空白；S/O/D 必须是 1–10 的整数，RPN 由服务端最终计算。
- 仅 usePermission('knowledge') 返回 canCreate/canEdit 时显示对应写操作入口；前后端均遵循维保主管知识库 RW+验证、技术员/观察者只读、操作员无知识库访问的权限矩阵。
- 表单字段错误必须使用 aria-invalid、aria-describedby 和 role="alert" 建立可访问关联。
- 关闭弹窗或请求失败不能丢失用户仍可重试的草稿；成功后关闭并依赖 ['fmea'] 查询失效刷新列表。
- 必须通过 npm run check:i18n、npx tsc -p tsconfig.json --noEmit、npx eslint src/ --max-warnings 1、Vitest 和 npm run build。
- FMEA 关联规则只能属于当前租户或系统租户；前端必须同步后端 DTO 的字段长度和 GUID 约束。

---

### Task 1: 建立风险计算与页面入口的失败测试

**Files:**
- Create: frontend/src/lib/__tests__/fmeaRisk.test.ts
- Create: frontend/src/pages/__tests__/FmeaPage.test.tsx
- Modify: none

**Interfaces:**
- Produces the executable contracts for calculateFmeaRpn, isValidFmeaRating, getFmeaRpnColor, and page-level create/edit controls.

- [ ] Step 1: Write the failing risk utility test.

    import { describe, expect, it } from 'vitest';
    import { calculateFmeaRpn, getFmeaRpnColor, isValidFmeaRating } from '../fmeaRisk';

    describe('fmeaRisk', () => {
      it('按 S/O/D 计算 RPN 并复用列表风险色阶', () => {
        expect(calculateFmeaRpn(5, 6, 7)).toBe(210);
        expect(getFmeaRpnColor(200)).toContain('red');
        expect(getFmeaRpnColor(100)).toContain('orange');
        expect(getFmeaRpnColor(99)).toContain('yellow');
      });

      it('只接受 1 到 10 的整数评分', () => {
        expect(isValidFmeaRating('1')).toBe(true);
        expect(isValidFmeaRating('10')).toBe(true);
        expect(isValidFmeaRating('')).toBe(false);
        expect(isValidFmeaRating('1.5')).toBe(false);
        expect(isValidFmeaRating('11')).toBe(false);
      });
    });

- [ ] Step 2: Write the failing page entry test.

Mock react-i18next to return the key, mock useFmeaEntries with an item and mock usePermission with all permissions enabled. Assert fmea.create is rendered, the row contains an edit button labelled fmea.editAction, and clicking create opens the fmea.formDescription dialog text. The current page has none of these controls, so the test must fail before implementation.

- [ ] Step 3: Run the focused tests and verify the red state.

    cd frontend
    npx vitest run src/lib/__tests__/fmeaRisk.test.ts src/pages/__tests__/FmeaPage.test.tsx

Expected: FAIL because fmeaRisk and the FMEA create/edit UI do not yet exist.

- [ ] Step 4: Commit the failing-test baseline.

    git add frontend/src/lib/__tests__/fmeaRisk.test.ts frontend/src/pages/__tests__/FmeaPage.test.tsx
    git commit -m "test: define FMEA frontend CRUD contracts"

### Task 2: 建立 FMEA 表单的失败测试

**Files:**
- Create: frontend/src/components/fmea/__tests__/FmeaFormDialog.test.tsx
- Modify: none

**Interfaces:**
- Consumes: FmeaEntry, CreateFmeaEntryRequest, FmeaFormDialogProps.
- Produces: regression coverage for create defaults, edit hydration, payload normalization, accessibility errors, RPN preview, and mutation failure handling.

- [ ] Step 1: Add the form fixture and hook mocks.

Mock react-i18next with readable Chinese labels, mock useCreateFmeaEntry and useUpdateFmeaEntry with mutateAsync and isPending, and create a complete FmeaEntry fixture containing S/O/D values 4/5/6.

- [ ] Step 2: Add failing behavior assertions.

Cover edit hydration and RPN 120; empty submit showing aria-invalid, aria-describedby=fmea-device-type-error, role=alert, and no mutation; create submit trimming all text and converting S/O/D to numbers; rejected mutation retaining the draft and displaying fmea.submitFailed; and out-of-range score validation.

- [ ] Step 3: Run the focused form test and verify the red state.

    cd frontend
    npx vitest run src/components/fmea/__tests__/FmeaFormDialog.test.tsx

Expected: FAIL because the dialog component is not implemented.

- [ ] Step 4: Commit the form contract tests.

    git add frontend/src/components/fmea/__tests__/FmeaFormDialog.test.tsx
    git commit -m "test: cover FMEA form validation and submission"

### Task 3: 实现风险工具和 FMEA 表单对话框

**Files:**
- Create: frontend/src/lib/fmeaRisk.ts
- Create: frontend/src/components/fmea/FmeaFormDialog.tsx
- Modify: frontend/src/components/fmea/__tests__/FmeaFormDialog.test.tsx

**Interfaces:**
- Consumes: FmeaEntry, CreateFmeaEntryRequest, useCreateFmeaEntry, useUpdateFmeaEntry.
- Produces: FmeaFormDialog({ open, entry, onOpenChange }), calculateFmeaRpn(severity, occurrence, detectability), isValidFmeaRating(value), and getFmeaRpnColor(rpn).

- [ ] Step 1: Implement the pure risk helpers.

    export function calculateFmeaRpn(severity: number, occurrence: number, detectability: number): number {
      return severity * occurrence * detectability;
    }

    export function isValidFmeaRating(value: string): boolean {
      if (!/^\\d+$/.test(value)) return false;
      const rating = Number(value);
      return rating >= 1 && rating <= 10;
    }

    export function getFmeaRpnColor(rpn: number): string {
      if (rpn >= 200) return 'bg-red-500/10 text-red-700';
      if (rpn >= 100) return 'bg-orange-500/10 text-orange-700';
      return 'bg-yellow-500/10 text-yellow-700';
    }

- [ ] Step 2: Implement controlled form state and initialization.

Use string state for all inputs, initialize blank values for create, and copy entry values into strings for edit. Reset state and errors whenever open or entry changes so closing a dialog cannot leak the previous draft into the next record.

- [ ] Step 3: Implement field validation and accessible error wiring.

Trim and require the six text fields; validate S/O/D with isValidFmeaRating. Render each error below its control with a stable ID such as fmea-device-type-error, role="alert", and set aria-invalid and aria-describedby only when invalid.

- [ ] Step 4: Implement the grouped industrial-risk layout.

Use DialogContent with max-h-[90vh] max-w-3xl overflow-y-auto; use a two-column text layout, a separate bordered risk-score block, and a live role="status" aria-live="polite" RPN badge. Show — until all three ratings are valid and apply getFmeaRpnColor to the badge.

- [ ] Step 5: Implement create/update submission and failure retention.

Build a CreateFmeaEntryRequest with trimmed text and numeric S/O/D. Omit knowledgeRuleId when blank. Call createMutation.mutateAsync for create and updateMutation.mutateAsync({ id: entry.id, request }) for edit. On success call onOpenChange(false); on rejection set translated fmea.submitFailed while preserving all field state.

- [ ] Step 6: Run form tests and make them pass.

    cd frontend
    npx vitest run src/lib/__tests__/fmeaRisk.test.ts src/components/fmea/__tests__/FmeaFormDialog.test.tsx

Expected: PASS with all risk, hydration, validation, accessibility, payload, and failure-retention cases green.

- [ ] Step 7: Commit the form implementation.

    git add frontend/src/lib/fmeaRisk.ts frontend/src/lib/__tests__/fmeaRisk.test.ts frontend/src/components/fmea/FmeaFormDialog.tsx frontend/src/components/fmea/__tests__/FmeaFormDialog.test.tsx
    git commit -m "feat: add FMEA create and edit form"

### Task 4: 接入页面权限入口并补齐双语文案

**Files:**
- Modify: frontend/src/pages/FmeaPage.tsx
- Modify: frontend/src/pages/__tests__/FmeaPage.test.tsx
- Modify: frontend/src/i18n/zh.json
- Modify: frontend/src/i18n/en.json

**Interfaces:**
- Consumes: FmeaFormDialog, getFmeaRpnColor, usePermission('knowledge').
- Produces: permission-aware create/edit controls and complete fmea.* bilingual keys.

- [ ] Step 1: Add exact bilingual keys.

Add matching keys under fmea in both locale files for form description, submit failure, score invalid messages, RPN preview, optional rule placeholder, and accessible enable/disable/edit/delete labels. Keep Chinese and English JSON key sets identical.

- [ ] Step 2: Add page state and the create button.

Add formOpen and editingEntry state. Render a Plus button in the title row only when perm.canCreate; clicking it sets editingEntry to null and opens the dialog.

- [ ] Step 3: Add the row edit button and labels.

Render a Pencil button only when perm.canEdit; clicking it stores the row and opens the dialog. Add translated aria-label/title values to edit, toggle, and delete icon-only buttons so existing actions remain keyboard and screen-reader discoverable.

- [ ] Step 4: Render the dialog and reuse the list risk helper.

Render FmeaFormDialog after the list. Replace page-local RPN color logic with getFmeaRpnColor so the list and form preview cannot diverge.

- [ ] Step 5: Finish page permission and opening tests.

Extend the page test with an all-permissions case that clicks create and edit, and a read-only case that asserts fmea.create and the row edit button are absent. Keep existing list, delete confirmation, and toggle behavior unchanged.

- [ ] Step 6: Run page and i18n tests.

    cd frontend
    npx vitest run src/pages/__tests__/FmeaPage.test.tsx
    npm run check:i18n

Expected: PASS; page tests verify both permission branches and the i18n checker reports no missing or extra keys.

- [ ] Step 7: Commit page integration.

    git add frontend/src/pages/FmeaPage.tsx frontend/src/pages/__tests__/FmeaPage.test.tsx frontend/src/i18n/zh.json frontend/src/i18n/en.json
    git commit -m "feat: complete FMEA frontend CRUD entry points"

### Task 5: 执行前端门禁、更新路线图并完成审查

**Files:**
- Modify: docs/PHASE5_ROADMAP.md
- Review: all files changed in Tasks 1–4

**Interfaces:**
- Consumes: completed FMEA form and page tests.
- Produces: verified frontend build and roadmap status reflecting that FMEA basic CRUD is complete.

- [ ] Step 1: Run focused regression.

    cd frontend
    npx vitest run src/lib/__tests__/fmeaRisk.test.ts src/components/fmea/__tests__/FmeaFormDialog.test.tsx src/pages/__tests__/FmeaPage.test.tsx

Expected: all focused FMEA tests pass.

- [ ] Step 2: Run complete frontend quality gates.

    cd frontend
    npm run check:i18n
    npx tsc -p tsconfig.json --noEmit
    npx eslint src/ --max-warnings 1
    npm test
    npm run build

Expected: each command exits with code 0, ESLint has no more than one warning, and the production build completes successfully.

- [ ] Step 3: Update the Phase 5 roadmap.

Change the FMEA item in docs/PHASE5_ROADMAP.md from frontend in progress to “基础 CRUD 已完成（列表、查询、新建、编辑、启停、删除）”, while leaving any later knowledge-rule selection work explicitly outside this slice.

- [ ] Step 4: Inspect the diff and repository hygiene.

    git diff --check
    git status --short
    git diff --stat HEAD~4..HEAD

Review that no credentials, generated artifacts, unrelated files, or English comments/logs were added; ensure the page only exposes write controls under the existing permission result.

- [ ] Step 5: Request final code review.

Use the requesting-code-review skill with the focused FMEA diff and test outputs. Resolve any actionable correctness, accessibility, i18n, or security findings before marking this slice complete.

- [ ] Step 6: Commit roadmap and verified cleanup.

    git add docs/PHASE5_ROADMAP.md
    git commit -m "docs: mark FMEA frontend CRUD complete"
