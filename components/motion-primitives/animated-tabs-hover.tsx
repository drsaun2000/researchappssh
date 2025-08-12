'use client';

import { AnimatedBackground } from '@/components/motion-primitives/animated-background';
import { usePathname, useRouter } from 'next/navigation';

export function AnimatedTabsHover() {
  const router = useRouter();
  const pathname = usePathname();

  const TABS = [
    { title: 'Explore', href: '/explore' },
    { title: 'Upload', href: '/upload' },
    { title: 'Library', href: '/library' },
    { title: 'PubMed', href: '/pubmed' }
  ];

  // Find current tab based on pathname
  const currentTab = TABS.find(tab => pathname === tab.href);
  const defaultValue = currentTab?.title || TABS[0].title;

  const handleTabClick = (tab: { title: string; href: string }) => {
    router.push(tab.href);
  };

  return (
    <div className='flex flex-row'>
      <AnimatedBackground
        defaultValue={defaultValue}
        className='rounded-lg bg-white/20 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50'
        transition={{
          type: 'spring',
          bounce: 0.2,
          duration: 0.4,
        }}
        enableHover
      >
        {TABS.map((tab, index) => (
          <button
            key={index}
            data-id={tab.title}
            type='button'
            onClick={() => handleTabClick(tab)}
            className='px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white relative z-10'
          >
            {tab.title}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  );
}
