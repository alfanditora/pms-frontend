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

const data = {
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
    activeIpps: [
        {
            name: "Design Engineering",
            url: "#",
            icon: Frame,
        },
        {
            name: "Sales & Marketing",
            url: "#",
            icon: PieChart,
        },
        {
            name: "Travel",
            url: "#",
            icon: Map,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <NavMain items={data.navMain} />
                <NavActiveIpp activeIpps={data.activeIpps} />
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}