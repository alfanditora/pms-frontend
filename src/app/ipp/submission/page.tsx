"use client"

import { useEffect, useState } from "react"
import ManagementSide from "@/components/active-ipp/managementSide"
import { Loader2 } from "lucide-react"
import { redirect } from "next/navigation"

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

    if (privilege === 'USER') {
        return redirect('#')
    } else {
        return <ManagementSide />
    }
}