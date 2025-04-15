// components/language-switcher.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = {
  en: { flag: "🇬🇧", label: "English" },
  fr: { flag: "🇫🇷", label: "Français" }
};

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Get current locale from URL
  const currentLocale = pathname.split('/')[1] || 'en';

  return (
    <Select
      defaultValue={currentLocale}
      onValueChange={(locale) => {
        // Get current path segments
        const segments = pathname.split('/');
        // Remove current locale (always at position 1)
        segments.splice(1, 1);
        // Create new path with new locale
        const newPath = `/${locale}${segments.join('/')}`;
        // Push to router
        router.push(newPath);
      }}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{languages[currentLocale].flag}</span>
            <span>{languages[currentLocale].label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([code, { flag, label }]) => (
          <SelectItem key={code} value={code}>
            <span className="flex items-center gap-2">
              <span>{flag}</span>
              <span>{label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}