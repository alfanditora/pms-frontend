"use client"

import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import AdminPage from "@/components/data-user/adminSide"
import { Loader2 } from "lucide-react"

type UserInfo = {
    privillege: "ADMIN" | "USER" | "OPERATION"
}

export default function UsersPage() {
    const [privilege, setPrivilege] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            const user: UserInfo = JSON.parse(storedUser)
            setPrivilege(user.privillege)
        }
        setIsLoading(false)
    }, [])

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    if (privilege === 'ADMIN') {
        return <AdminPage />
    } else {
        return redirect('#')
    }
}