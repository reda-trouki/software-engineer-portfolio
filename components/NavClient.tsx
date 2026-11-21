'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { initials } from '@/lib/format';
import ThemeToggle from './ThemeToggle';
import type { MouseEvent, ReactNode } from 'react';

type NavLink = {
    href: string;
    label: string;
    key?: string;
};

type NavClientProps = {
    name: string;
    links: NavLink[];
    contactLabel: string;
    menuLabel: string;
    active?: 'blog' | 'templates';
    desktopLangSwitch: ReactNode;
    mobileLangSwitch: ReactNode;
};

export default function NavClient({
    name,
    links,
    contactLabel,
    menuLabel,
    active,
    desktopLangSwitch,
    mobileLangSwitch,
}: NavClientProps) {
    const pathname = usePathname();
    const [activeSection, setActiveSection] = useState<string | null>(
        active ?? null,
    );

    useEffect(() => {
        // Blog and Templates use the page-level active prop.
        if (active) {
            setActiveSection(active);
            return;
        }

        const sectionIds = [
            ...links
                .filter((link) => link.href.startsWith('/#'))
                .map((link) => link.href.split('#')[1]),
            'contact',
        ];

        const sections = sectionIds
            .map((id) => document.getElementById(id))
            .filter((section): section is HTMLElement => section !== null);

        if (!sections.length) {
            setActiveSection(null);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleSections = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top,
                    );

                if (visibleSections.length) {
                    setActiveSection(visibleSections[0].target.id);
                }
            },
            {
                // Activate a section when it enters the central viewing area.
                rootMargin: '-20% 0px -65% 0px',
                threshold: 0,
            },
        );

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, [active, links, pathname]);

    const closeMobileMenu = (event: MouseEvent<HTMLAnchorElement>) => {
        event.currentTarget.closest('details')?.removeAttribute('open');
    };

    const isActive = (link: NavLink) => {
        const key = link.key ?? link.href.split('#')[1];
        return key === activeSection;
    };

    const linkClass = (link: NavLink) =>
        [
            'group relative rounded-full px-3.5 py-2',
            'text-[13px] transition-colors duration-200',
            'hover:text-fg',
            isActive(link) ? 'text-fg' : 'text-muted',
            // Animated underline
            'after:absolute after:bottom-1 after:start-3.5 after:end-3.5',
            'after:h-px after:origin-left after:scale-x-0',
            'after:bg-accent after:transition-transform after:duration-300',
            'hover:after:scale-x-100',
            isActive(link) ? 'after:scale-x-100' : '',
        ].join(' ');

    return (
        <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
            <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-3 rounded-full border border-line2 bg-bg/75 py-1.5 ps-5 pe-1.5 shadow-sm backdrop-blur-xl">

                {/* Brand */}
                <Link
                    href="/"
                    className="flex min-h-10 shrink-0 items-center gap-2.5 font-mono text-sm font-medium text-fg"
                    dir="ltr"
                >
                    <span className="size-2.5 rounded-[3px] bg-accent" />
                    <span>
                        {initials(name)}
                        <span className="text-muted">.dev</span>
                    </span>
                </Link>

                {/* Desktop navigation */}
                <nav
                    aria-label="Main navigation"
                    className="hidden items-center gap-0.5 md:flex"
                >
                    {links.map((link) => {
                        const selected = isActive(link);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={linkClass(link)}
                                aria-current={selected ? 'location' : undefined}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                    {desktopLangSwitch}
                    <ThemeToggle className="hidden md:flex" />

                    <Link
                        data-magnetic
                        href="/#contact"
                        onClick={() => {
                            // On the home page jump straight there; from other pages the
                            // hash scroll in Animations.tsx finishes the job after navigation.
                            setActiveSection('contact');
                            if (pathname === '/') {
                                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        aria-current={activeSection === 'contact' ? 'location' : undefined}
                        className={[
                            'relative flex min-h-10 items-center rounded-full',
                            'bg-accent px-5 text-[13px] font-medium text-ink',
                            'transition-all duration-200 hover:brightness-105',
                            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20',
                        ].join(' ')}
                    >
                        {contactLabel}
                    </Link>

                    {/* Mobile menu */}
                    <details className="group relative md:hidden">
                        <summary
                            aria-label={menuLabel}
                            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-line2 text-fg transition-colors hover:bg-line [&::-webkit-details-marker]:hidden"
                        >
                            <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                aria-hidden="true"
                            >
                                <path d="M4 8h16M4 16h16" />
                            </svg>
                        </summary>

                        <div className="absolute end-0 top-12 flex w-[min(280px,calc(100vw-24px))] flex-col rounded-2xl border border-line2 bg-surface p-2 shadow-2xl">
                            {links.map((link) => {
                                const selected = isActive(link);

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={closeMobileMenu}
                                        aria-current={selected ? 'location' : undefined}
                                        className={[
                                            'flex items-center justify-between rounded-xl px-4 py-3',
                                            'text-sm transition-colors hover:bg-line',
                                            selected ? 'bg-line text-fg' : 'text-muted',
                                        ].join(' ')}
                                    >
                                        {link.label}

                                        {selected && (
                                            <span
                                                aria-hidden="true"
                                                className="size-1.5 rounded-full bg-accent"
                                            />
                                        )}
                                    </Link>
                                );
                            })}

                            <Link
                                href="/#contact"
                                onClick={closeMobileMenu}
                                className="mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm text-muted transition-colors hover:bg-line hover:text-fg"
                            >
                                {contactLabel}
                                <span aria-hidden="true">↗</span>
                            </Link>

                            <div className="mt-1 flex items-center justify-between gap-2 border-t border-line px-2 pb-1 pt-3">
                                {mobileLangSwitch}
                                <ThemeToggle />
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </header>
    );
}