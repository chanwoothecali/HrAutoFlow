'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: '대시보드', href: '/dashboard' },
  { name: '지원자', href: '/candidates' },
  { name: '채용 공고', href: '/jobs' },
];

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Topbar() {
  const pathname = usePathname();

  const isCurrent = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="ml-48 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex ">
            {/* logo */}
            <div className="flex items-center  mr-20">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
                U
              </span>
              <span className="ml-2 text-lg font-semibold text-indigo-700">
                UHire
              </span>
            </div>

            {/* navigation bar */}
            <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isCurrent(item.href) ? 'page' : undefined}
                  className={classNames(
                    isCurrent(item.href)
                      ? 'border-indigo-600 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
