import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import AuthLayout from "@/components/layouts/AuthLayout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "If an account exists with this email, you will receive password reset instructions shortly.",
      });
      
      // Clear the form
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="relative">
        <AnimatedBackground type="neon" primaryColor="#7c3aed" secondaryColor="#a855f7" speed="medium" />

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-[min(400px,100%-2rem)] mx-auto">
            <Card className="w-full bg-[#0f0f23]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15),0_0_60px_rgba(6,182,212,0.08)]">
              <CardHeader className="space-y-3 pb-6">
                <div className="flex justify-center">
                  <div className="w-64">
                    <img
                      src="/uploads/KickDeck_Linear_White.png"
                      alt="KickDeck Logo"
                      className="w-full h-full object-contain"
                      style={{ filter: "drop-shadow(0 0 20px rgba(124,58,237,0.3))" }}
                    />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-white">
                    Reset Password
                  </CardTitle>
                  <p className="text-sm text-gray-400">We'll send you reset instructions</p>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                    id="reset-form"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-300">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="email"
                              className="neon-input h-11 text-base px-4 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-purple-500/20 focus:shadow-[0_0_10px_rgba(124,58,237,0.15)]"
                              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-11 text-base bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Instructions'
                      )}
                    </Button>

                    <div className="text-center">
                      <Link href="/auth">
                        <Button variant="link" className="w-full text-sm text-gray-400 p-0 h-auto font-medium hover:text-purple-400 transition-colors" type="button">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Login
                        </Button>
                      </Link>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}