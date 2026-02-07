import { Search, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserMenu } from './user-menu'

export function DashboardHeader() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        data-testid="sidebar-toggle"
        className="md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="pl-9"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Menu */}
      <UserMenu />
    </header>
  )
}
