'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ProfileSection = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data: { name: string; email: string; avatarUrl: string }) => {
        setName(data.name);
        setEmail(data.email);
        setAvatarUrl(data.avatarUrl);
      })
      .catch(() => {});
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      const { avatarUrl: newUrl } = (await res.json()) as { avatarUrl: string };
      // Cache-bust so the browser re-fetches the new image
      setAvatarUrl(`${newUrl}?t=${Date.now()}`);
      window.dispatchEvent(new Event('profile-updated'));
      toast.success('프로필 사진이 저장되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error('저장 실패');
      toast.success('프로필이 저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const initials = name.trim() ? name.trim()[0].toUpperCase() : 'U';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Avatar column */}
        <div className="flex flex-shrink-0 flex-col items-center gap-3" style={{ width: 160 }}>
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl} alt="Profile" />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void handleAvatarChange(e)}
          />
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? '업로드 중...' : '사진 변경'}
          </Button>
          <p className="text-muted-foreground text-center text-xs">JPG, PNG, WebP (최대 5MB)</p>
        </div>

        {/* Form column */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full cursor-pointer md:w-auto"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
