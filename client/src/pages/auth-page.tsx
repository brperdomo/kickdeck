import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { login, register: registerUser } = useUser();
  const [isRegistering, setIsRegistering] = useState(false);
  const [userType, setUserType] = useState<"player" | "parent">("player");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      isParent: false,
    },
  });

  const form = isRegistering ? registerForm : loginForm;

  async function onSubmit(data: LoginFormData | RegisterFormData) {
    try {
      if (isRegistering) {
        const registerData = data as RegisterFormData;
        const { confirmPassword, ...userData } = registerData;
        const submitData: InsertUser = {
          ...userData,
          phone: userData.phone || null,
          isParent: userType === "parent",
          createdAt: new Date().toISOString(),
        };
        const result = await registerUser(submitData);
        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
          });
          return;
        }
      } else {
        const loginData = data as LoginFormData;
        const result = await login({
          ...loginData,
          username: loginData.email, // Use email as username for login
        });
        if (!result.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: isRegistering ? "Registration successful" : "Login successful",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Soccer Registration System</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={isRegistering ? "register" : "login"} onValueChange={(v) => setIsRegistering(v === "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {isRegistering && (
                  <RadioGroup
                    defaultValue="player"
                    value={userType}
                    onValueChange={(v) => setUserType(v as "player" | "parent")}
                    className="flex justify-center space-x-4 mb-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="player" id="player" />
                      <label htmlFor="player">Register as Player</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="parent" id="parent" />
                      <label htmlFor="parent">Register as Parent</label>
                    </div>
                  </RadioGroup>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isRegistering && (
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      {isRegistering && (
                        <FormDescription>
                          Must be at least 8 characters with a number and special character
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isRegistering && (
                  <>
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field: { value, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              {...fieldProps}
                              value={value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  {isRegistering ? "Register" : "Login"}
                </Button>
              </form>
            </Form>
            {!isRegistering && (
              <div className="text-center mt-4">
                <Button variant="link" className="text-sm text-green-600" type="button">
                  Forgot Password?
                </Button>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}