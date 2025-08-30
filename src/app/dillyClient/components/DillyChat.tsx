'use client'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '$components/shadcn/ui/card'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '~/lib/utils'
import Image from 'next/image'
import { FaRobot } from 'react-icons/fa'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const currentPath = pathname.split('/').at(-1)

  const navItems = [
    {
      name: 'new chat',
      slug: 'klaviyo',
      path: '/dashboard/dilly',
    },
  ]

  return (
    <Card
      className={`h-full w-full min-w-64 bg-white shadow-md border border-zinc-200 gap-4 flex flex-col rounded-lg pt-4 ${className}`}
    >
      <CardContent className="flex-1 flex flex-col gap-1.5 px-3">
        {navItems.map((item) => (
          <Link
            href={item.path}
            key={item.name}
            className={cn(
              'w-full flex items-center justify-between hover:bg-gray-100 p-2 px-3.5 font-medium text-foreground rounded-md transition-all duration-300 no-underline',
              { 'bg-slate-200': currentPath === item.slug },
            )}
          >
            <div className="flex items-center">
              <FaRobot className="text-2xl text-gray-600 mr-2 flex-shrink-0" />

              <span>{item.name}</span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
