'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { IconDownload, IconUpload, IconAlertTriangle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface RestoreResult {
  ok: boolean;
  restored: {
    exchangeKeys: number;
    stockHoldings: number;
    cryptoHoldings: number;
  };
}

const DataSection = () => {
  const [restoring, setRestoring] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const a = document.createElement('a');
    a.href = '/api/backup';
    a.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestore = async () => {
    if (!pendingFile) return;
    setRestoring(true);
    setConfirmOpen(false);
    try {
      const text = await pendingFile.text();
      const json = JSON.parse(text) as unknown;
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = (await res.json()) as RestoreResult | { error: string };
      if (!res.ok || !('ok' in data)) {
        throw new Error('error' in data ? data.error : '복원 실패');
      }
      const { restored } = data;
      toast.success(
        `복원 완료: 거래소 ${restored.exchangeKeys}개, 주식 ${restored.stockHoldings}개, 크립토 ${restored.cryptoHoldings}개`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '복원에 실패했습니다.');
    } finally {
      setRestoring(false);
      setPendingFile(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Export */}
      <div className="flex flex-col gap-3">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          백업 내보내기
        </h3>
        <p className="text-muted-foreground text-sm">
          거래소 API 키, 보유 주식, 보유 크립토 데이터를 JSON 파일로 내보냅니다.
        </p>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <p className="flex items-center gap-1.5 font-medium">
            <IconAlertTriangle size={14} />
            보안 주의
          </p>
          <p className="mt-1 text-xs">
            백업 파일에는 복호화된 API 키가 포함됩니다. 안전한 장소에 보관하세요.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            className="cursor-pointer gap-2"
            onClick={handleExport}
          >
            <IconDownload size={16} />
            백업 다운로드
          </Button>
        </div>
      </div>

      <div className="border-t" />

      {/* Import */}
      <div className="flex flex-col gap-3">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          백업 복원
        </h3>
        <p className="text-muted-foreground text-sm">
          기존 데이터에 병합됩니다. 동일한 항목(거래소명/티커/심볼)이 있으면 덮어씁니다.
        </p>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            className="cursor-pointer gap-2"
            disabled={restoring}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconUpload size={16} />
            {restoring ? '복원 중...' : '백업 파일 선택'}
          </Button>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmOpen && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">백업 복원 확인</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              <span className="font-medium text-foreground">{pendingFile.name}</span> 파일로
              복원합니다. 동일한 항목은 덮어씁니다. 계속할까요?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => { setConfirmOpen(false); setPendingFile(null); }}
              >
                취소
              </Button>
              <Button
                className="cursor-pointer"
                onClick={() => void handleRestore()}
              >
                복원
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSection;
