'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
})

type SignInFormValues = z.infer<typeof formSchema>

export default function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const [loading, startTransition] = useTransition()

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: 'info@universalmedica.com',
      password: ''
    }
  })

  const onSubmit = async (data: SignInFormValues) => {
    startTransition(() => {
      signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: callbackUrl ?? '/dashboard'
      })
      toast.success('Signed in successfully!')
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="grid gap-3">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="m@example.com"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="grid gap-3">
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <a
                  href="#"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3">
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            Login
          </Button>
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Sign up
          </a>
        </div>
      </form>
    </Form>
  )
} 