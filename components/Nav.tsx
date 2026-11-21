import { getI18n } from '@/lib/locale';
import LangSwitch from './LangSwitch';
import NavClient from './NavClient';

export default async function Nav({
  name,
  active,
}: {
  name: string;
  active?: 'blog' | 'templates';
}) {
  const { t } = await getI18n();

  const links = [
    { href: '/#about', label: t.nav.about },
    { href: '/#projects', label: t.nav.projects },
    { href: '/#education', label: t.nav.education },
    { href: '/#experience', label: t.nav.experience },
    { href: '/blog', label: t.nav.blog, key: 'blog' },
    { href: '/templates', label: t.nav.templates, key: 'templates' },
  ];

  return (
    <NavClient
      name={name}
      links={links}
      active={active}
      contactLabel={t.nav.contact}
      menuLabel={t.nav.menu}
      desktopLangSwitch={<LangSwitch className="hidden md:inline-flex" />}
      mobileLangSwitch={<LangSwitch />}
    />
  );
}