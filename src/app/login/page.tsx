"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function LoginPage() {
    const [npk, setNpk] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            // Perbaikan URL - tambahkan http://
            const res = await fetch("http://localhost:4000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ npk, password }),
            });

            // Cek apakah response adalah JSON
            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                throw new Error("Server did not return JSON response");
            }

            if (!res.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${res.status}`);
            }

            if (data.token) {
                document.cookie = `token=${data.token}; path=/; max-age=${24 * 60 * 60}; SameSite=lax`;
                
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            }

            toast.success("Login Successful", {
                description: `Welcome ${data.user?.name || 'User'}`,
            });

            router.push("/dashboard");
        } catch (err: any) {
            console.error("Login error:", err);
            
            let errorMessage = "Your Email or Password is wrong. Contact IT Administrator";
            
            if (err.name === "TypeError" && err.message.includes("fetch")) {
                errorMessage = "Cannot connect to server. Please check your connection.";
            } else if (err.message.includes("JSON")) {
                errorMessage = "Server error. Please try again later.";
            } else if (err.message) {
                errorMessage = err.message;
            }

            toast.error("Login Failed", {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted">
            <Card className="w-full max-w-sm">
                <CardHeader className="flex flex-col items-center text-center gap-2">
                    <Image
                        src="/img/GM.png"
                        alt="Logo"
                        width={60}
                        height={60}
                        className="rounded scale-170"
                    />
                    <CardTitle>Performance Monitoring System</CardTitle>
                    <CardDescription>
                        Enter your NPK below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="NPK">User ID</Label>
                                <Input
                                    id="NPK"
                                    type="text"
                                    placeholder="NPK"
                                    value={npk}
                                    onChange={(e) => setNpk(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        
                        <Separator className="my-6" />
                        
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            <div className="text-muted-foreground text-center text-xs m-5">
                PMS App 1.0.0 Version
            </div>
        </div>
    );
}