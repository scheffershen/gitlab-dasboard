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

  return (
    <Select
      onValueChange={(locale) => {
        router.push(`/${locale}${pathname}`);
      }}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Language 🌐" />
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