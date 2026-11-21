'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UtensilsCrossed, Users, PlusCircle, History } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/',
      label: 'Ăn 1 mình',
      icon: UtensilsCrossed,
      isActive: pathname === '/'
    },
    {
      href: '/group',
      label: 'Kèo nhóm',
      icon: Users,
      isActive: pathname.startsWith('/group') || pathname.startsWith('/room')
    },
    {
      href: '/history',
      label: 'Lịch sử',
      icon: History,
      isActive: pathname === '/history'
    },
    {
      href: '/contribute',
      label: '+ Góp quán',
      icon: PlusCircle,
      isActive: pathname === '/contribute'
    }
  ]

  return (
    <nav className="fixed bottom-0 max-w-[430px] w-full bg-bistro-cream/95 backdrop-blur-md border-t border-bistro-border z-30 px-3 py-2">
      <div className="flex items-center justify-around gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 ${
                item.isActive
                  ? 'bg-bistro-paper border-[1.5px] border-bistro-ink shadow-[2px_2px_0px_#1C1917] text-bistro-sriracha font-bold'
                  : 'text-bistro-muted hover:text-bistro-ink font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${item.isActive ? 'stroke-[2.5px] text-bistro-sriracha' : 'stroke-[1.8px]'}`} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
