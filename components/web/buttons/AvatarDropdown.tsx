'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface Profile {
  name: string;
  avatarUrl: string;
}

const AvatarDropdown = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({ name: '', avatarUrl: '' });

  const fetchProfile = () => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data: Profile) => setProfile(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener('profile-updated', fetchProfile);
    return () => window.removeEventListener('profile-updated', fetchProfile);
  }, []);

  const initials = profile.name.trim() ? profile.name.trim()[0].toUpperCase() : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatarUrl} alt="profile" />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-32 bg-white">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push('/settings?tab=profile')}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/settings')}>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarDropdown;
