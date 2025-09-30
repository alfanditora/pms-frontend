"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    Trophy,
    Database,
    Frame,
    Map,
    PieChart,
    FileCheck,
} from "lucide-react"

import { NavActiveIpp } from "./nav-ipp"
import { NavMain } from "./nav-main"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenuButton,
    SidebarRail,
} from "@/components/ui/sidebar"

const userData = {
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
            items: [],
        },
        {
            title: "Management User",
            url: "/management-user",
            icon: Users,
            items: [],
        },
        {
            title: "Master Data",
            url: "#",
            icon: Database,
            items: [
                {
                    title: "Category",
                    url: "/master-data/category",
                },
                {
                    title: "Department",
                    url: "/master-data/department",
                },
            ],
        },
        {
            title: "IPP",
            url: "#",
            icon: FolderKanban,
            items: [
                {
                    title: "IPP Monitoring",
                    url: "/ipp/monitoring",
                },
                {
                    title: "IPP Entry",
                    url: "/ipp/entry",
                },
            ],
        },
        {
            title: "Achievement",
            url: "#",
            icon: Trophy,
            items: [
                {
                    title: "Achievement Entry",
                    url: "/achievement/entry",
                },
            ],
        },
    ],
}

const managementData = {
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
            items: [],
        },
        {
            title: "Management User",
            url: "/management-user",
            icon: Users,
            items: [],
        },
        {
            title: "Master Data",
            url: "#",
            icon: Database,
            items: [
                {
                    title: "Category",
                    url: "/master-data/category",
                },
                {
                    title: "Department",
                    url: "/master-data/department",
                },
                {
                    title: "Users",
                    url: "/master-data/users",
                },
            ],
        },
        {
            title: "IPP",
            url: "#",
            icon: FolderKanban,
            items: [
                {
                    title: "IPP Monitoring",
                    url: "/ipp/monitoring",
                },
                {
                    title: "IPP Submission",
                    url: "/ipp/submission",
                },
                {
                    title: "IPP Entry",
                    url: "/ipp/entry",
                },
                {
                    title: "IPP Database",
                    url: "/ipp/database",
                },
            ],
        },
        {
            title: "Achievement",
            url: "#",
            icon: Trophy,
            items: [
                {
                    title: "Achievement Entry",
                    url: "/achievement/entry",
                },
            ],
        },
    ],
}

function parseJwt(token: string) {
    try {
        return JSON.parse(atob(token.split(".")[1]))
    } catch {
        return null
    }
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const [currentUser, setCurrentUser] = React.useState<any>(null)
    const getToken = () => {
        const cookies = document.cookie.split(';')
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='))
        return tokenCookie ? tokenCookie.split('=')[1] : null
    }

    React.useEffect(() => {
        const token = getToken()
        if (!token) return

        const decoded = parseJwt(token)
        if (decoded?.npk) {
            fetch(`http://localhost:4000/api/user/${decoded.npk}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    setCurrentUser(data?.data ? data.data : data)
                })
                .catch((err) => console.error("Failed to fetch user profile:", err))
        }
    }, [])

    const menuData =
        currentUser?.privillege === "ADMIN" ||
            currentUser?.privillege === "OPERATION"
            ? managementData
            : userData

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    <div className="bg-white border border-black text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <img className="size-4 scale-300" src="/img/GM.png" alt="GM Logo" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">PMS App</span>
                        <span className="truncate text-xs">V 1.0.0</span>
                    </div>
                </SidebarMenuButton>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={menuData.navMain} />
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}