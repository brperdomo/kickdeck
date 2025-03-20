import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type InsertUser } from "@db/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { YouTubeBackground } from "@/components/ui/YouTubeBackground";
import { useLocation } from "wouter";
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
import { Trophy, Loader2 } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";
import { useEffect } from "react";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { loginMutation, user } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle redirect on login success
  useEffect(() => {
    if (loginMutation.isSuccess || user) {
      const redirectPath = sessionStorage.getItem('redirectAfterAuth');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterAuth');
        setLocation(redirectPath);
      } else {
        // Handle role-based redirection
        const userData = loginMutation.data?.user || user;
        if (userData?.isAdmin) {
          setLocation('/admin');
        } else {
          setLocation('/');
        }
      }
    }
  }, [loginMutation.isSuccess, user, setLocation]);

  async function onSubmit(data: LoginFormData) {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error: any) {
      console.error('Login error:', error);
    }
  }

  return (
    <div className="min-h-screen w-full relative">
      <YouTubeBackground videoId="OdObDXBzNYk" />

      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-[min(400px,100%-2rem)] mx-auto">
          <Card className="w-full bg-white/50 backdrop-blur-md shadow-xl border-0">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex justify-center">
                <div className="w-100 h-100">
                  <img
                    src="/uploads/MatchProAI_Linear_Black.png"
                    alt="MatchPro Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-gray-900">
                Sign In to MatchPro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onSubmit)}
                  className="space-y-5"
                  id="login-form"
                  name="login"
                  autoComplete="on"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="username email"
                            className="h-11 text-base px-4"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            className="h-11 text-base px-4"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-11 text-base bg-green-600 hover:bg-green-700 transition-colors"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                  <Link href="/forgot-password">
                    <Button variant="link" className="w-full text-sm text-green-600 p-0 h-auto font-semibold hover:text-green-700">
                      Forgot Password?
                    </Button>
                  </Link>
                  <div className="text-center">
                    <p className="text-sm sm:text-base text-gray-600">
                      New to MatchPro?{" "}
                      <Link href="/register">
                        <Button variant="link" className="p-0 h-auto font-semibold text-green-600 hover:text-green-700">
                          Register Here
                        </Button>
                      </Link>
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}