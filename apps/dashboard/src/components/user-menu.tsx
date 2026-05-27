'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, LayoutDashboard, CreditCard, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth/auth-provider';

export function UserMenu() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const isOnDashboard = pathname === '/dashboard';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus:outline-none">
          <User className="h-5 w-5" />
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium truncate">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isOnDashboard && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center cursor-pointer">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/subscriptions" className="flex items-center cursor-pointer">
            <CreditCard className="w-4 h-4 mr-2" />
            Subscriptions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
