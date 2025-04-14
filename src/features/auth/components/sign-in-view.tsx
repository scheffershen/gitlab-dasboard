import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import LoginInForm from "./login-in-form"
import { useTranslations } from 'next-intl'
import LanguageSwitcher from "@/components/language-switcher"

interface SignInViewProps {
  stars?: number
  className?: string
}

export default function SignInView({ stars, className }: SignInViewProps) {
  const t = useTranslations('auth.signIn')

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className={cn("w-full max-w-sm", className)}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('title')}</CardTitle>
              <LanguageSwitcher />
            </div>
            <CardDescription>{t('description')}</CardDescription>  
          </CardHeader>
          <CardContent>
            <LoginInForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 