import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type InsertUser } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { SoccerFieldBackground } from "@/components/ui/SoccerFieldBackground";
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
import { Trophy } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";

// Login schema
const loginSchema = z.object({
  loginEmail: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { login } = useUser();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginEmail: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const result = await login({
        username: data.loginEmail,
        password: data.password,
        email: data.loginEmail,
        firstName: "",
        lastName: "",
        phone: null,
        isParent: false,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      });

      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }

      toast({
        title: "Success",
        description: "Login successful",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      <SoccerFieldBackground className="opacity-50" />
      <div className="w-full max-w-[min(400px,100%-2rem)] mx-auto relative z-10">
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-50 p-3">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
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
                  name="loginEmail"
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
                      <div className="text-right">
                        <Link href="/forgot-password">
                          <Button variant="link" className="text-sm text-green-600 p-0 h-auto font-semibold hover:text-green-700">
                            Forgot Password?
                          </Button>
                        </Link>
                      </div>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Login
                </Button>
                <div className="pt-2 text-center">
                  <p className="text-sm sm:text-base text-gray-600">
                    New to MatchPro?{" "}
                    <Link href="/register">
                      <a className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                        Register Here
                      </a>
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}