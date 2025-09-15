"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function getInitials(name: string) {
    return name
        .split(" ")
        .map(word => word[0])
        .join("")
        .toUpperCase();
}

export default function Navbar() {
    const userName = "John Doe";

    return (
        <nav className="w-full bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-2 py-2 flex items-center justify-between">

                {/* Left */}
                <div className="flex items-center gap-2">
                    <Image
                        src="/img/GM.png"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="rounded scale-150"
                    />
                </div>

                {/* Right */}
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">
                        {userName}
                    </span>
                    <Avatar>
                        <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                    </Avatar>
                    <Button variant="secondary">Sign Out</Button>
                </div>
            </div>
        </nav>
    )
}
