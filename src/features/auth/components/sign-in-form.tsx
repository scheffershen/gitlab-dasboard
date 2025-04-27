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
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useState, useCallback  } from 'react';
import { Eye, EyeOff } from 'lucide-react';



const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
})

type SignInFormValues = z.infer<typeof formSchema>

export default function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const [loading, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: SignInFormValues) => {
    startTransition(async () => {
      try {
        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          callbackUrl: callbackUrl ?? '/dashboard',
          redirect: false
        })
        
        if (result?.error) {
          toast.error('Invalid email or password')
        } else {
          toast.success('Signed in successfully!')
          window.location.href = result?.url || '/dashboard'
        }
      } catch (error) {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  function usePasswordVisibility() {
    const [showPassword, setShowPassword] = useState(false);
    
    const togglePasswordVisibility = useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);
  
    return { showPassword, togglePasswordVisibility };
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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    disabled={loading}
                    {...field}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    tabIndex={0}
                    aria-disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3">
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Login'
            )}
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