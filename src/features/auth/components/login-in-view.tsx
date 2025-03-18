'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import LoginInForm from "./login-in-form"

interface SignInViewProps {
  stars?: number
  className?: string
}

export default function LoginInView({ stars, className }: SignInViewProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className={cn("w-full max-w-sm", className)}>
        <Card>
          <CardHeader>
            <CardTitle>GitLab Dashboard</CardTitle>
            <CardDescription>
              Please enter your email and password. 
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginInForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 