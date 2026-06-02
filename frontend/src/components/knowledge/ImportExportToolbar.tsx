import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Download, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useExportRules, useImportPresetRules } from '../../hooks/useKnowledge';
import ImportPreviewDialog from './ImportPreviewDialog';

/**
 * 导入导出工具栏组件
 *
 * 提供文件导入（带预览）、导出（JSON/CSV）和行业预置一键导入功能。
 */
export default function ImportExportToolbar() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMutation = useExportRules();
  const presetMutation = useImportPresetRules();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  /** 选择文件后打开预览对话框 */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewOpen(true);
      // 重置 input 以支持再次选择同一文件
      e.target.value = '';
    }
  };

  /** 触发文件选择器 */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /** 导出为指定格式 */
  const handleExport = (format: 'csv' | 'json') => {
    exportMutation.mutate({ format });
  };

  /** 导入行业预置规则 */
  const handleImportPreset = () => {
    presetMutation.mutate();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 导入按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
        >
          <Upload className="mr-2 h-4 w-4" />
          {t('knowledge.importExport.import')}
        </Button>

        {/* 导出下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t('knowledge.importExport.export')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              {t('knowledge.importExport.exportCSV')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              {t('knowledge.importExport.exportJSON')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 行业预置导入按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportPreset}
          disabled={presetMutation.isPending}
        >
          <Zap className="mr-2 h-4 w-4" />
          {presetMutation.isPending ? t('common.loading') : t('knowledge.importPreset')}
        </Button>
      </div>

      {/* 导入预览对话框 */}
      <ImportPreviewDialog
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
      />
    </>
  );
}
