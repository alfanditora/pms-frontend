"use client"

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "../ui/button";


export function LogoutButton() {
    const router = useRouter()
    const handleLogout = () => {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        localStorage.removeItem("user")
        router.push("/login")
        toast.success("Logged out successfully")
    }

    return (
        <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
        </Button>
    )
}