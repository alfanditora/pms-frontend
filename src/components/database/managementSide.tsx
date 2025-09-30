"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogoutButton } from "@/components/navbar/logout"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, RefreshCw, Eye, CheckCircle, Clock, XCircle, FileText, Send } from "lucide-react"
import { toast } from "sonner"

// --- TYPE DEFINITIONS UPDATED ---
type UserInfo = {
    npk: string
    name: string
    department: {
        name: string
    }
}

type Ipp = {
    ipp: string
    year: number
    submitAt: string | null
    verify: "PENDING" | "VERIFIED" | "REJECTED"
    approval: "PENDING" | "APPROVED" | "REJECTED"
    user: UserInfo
}

export default function ManagementSide() {
    const [ipps, setIpps] = useState<Ipp[]>([])
    const [filteredIpps, setFilteredIpps] = useState<Ipp[]>([])
    const [loading, setLoading] = useState(true)

    // --- STATE FOR FILTERS ---
    const [searchTerm, setSearchTerm] = useState("")
    const [yearFilter, setYearFilter] = useState<string>("all")
    const [departmentFilter, setDepartmentFilter] = useState<string>("all")
    const [submitStatusFilter, setSubmitStatusFilter] = useState<string>("all")
    const [verifyStatusFilter, setVerifyStatusFilter] = useState<string>("all")
    const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>("all")

    const router = useRouter()

    const getToken = () => document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]

    const fetchIpps = async () => {
        setLoading(true)
        try {
            const token = getToken()
            const res = await fetch(`http://localhost:4000/api/ipp/all`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) throw new Error(`Failed to fetch IPPs: ${res.status}`)

            const data = await res.json()
            console.log("API Response:", data) // Debug log
            setIpps(Array.isArray(data) ? data : [])
        } catch (err: any) {
            console.error("Fetch error:", err) // Debug log
            toast.error(err.message || "Failed to load IPP data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIpps()
    }, [])

    // --- FILTERING LOGIC ---
    useEffect(() => {
        let filtered = ipps

        // Filter by search term (IPP ID, NPK, Name)
        if (searchTerm) {
            filtered = filtered.filter(ipp =>
                ipp.ipp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ipp.user?.npk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ipp.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filter by year
        if (yearFilter !== "all") {
            filtered = filtered.filter(ipp => ipp.year?.toString() === yearFilter)
        }

        // Filter by department
        if (departmentFilter !== "all") {
            filtered = filtered.filter(ipp => ipp.user?.department?.name === departmentFilter)
        }

        // Filter by submit status
        if (submitStatusFilter !== "all") {
            if (submitStatusFilter === "SUBMITTED") {
                filtered = filtered.filter(ipp => ipp.submitAt !== null)
            } else if (submitStatusFilter === "DRAFT") {
                filtered = filtered.filter(ipp => ipp.submitAt === null)
            }
        }

        // Filter by verify status
        if (verifyStatusFilter !== "all") {
            filtered = filtered.filter(ipp => ipp.verify === verifyStatusFilter)
        }

        // Filter by approval status
        if (approvalStatusFilter !== "all") {
            filtered = filtered.filter(ipp => ipp.approval === approvalStatusFilter)
        }

        setFilteredIpps(filtered)
    }, [searchTerm, yearFilter, departmentFilter, submitStatusFilter, verifyStatusFilter, approvalStatusFilter, ipps])

    const handleRefresh = () => {
        setSearchTerm("")
        setYearFilter("all")
        setDepartmentFilter("all")
        setSubmitStatusFilter("all")
        setVerifyStatusFilter("all")
        setApprovalStatusFilter("all")
        fetchIpps()
        toast.success("Data and filters refreshed")
    }

    // --- GET UNIQUE VALUES FOR FILTERS ---
    const uniqueYears = useMemo(() => {
        const years = ipps.filter(ipp => ipp.year).map(ipp => ipp.year)
        return [...new Set(years)].sort((a, b) => b - a)
    }, [ipps])

    const uniqueDepartments = useMemo(() => {
        const departments = ipps
            .filter(ipp => ipp.user?.department?.name)
            .map(ipp => ipp.user.department.name)
        return [...new Set(departments)].sort()
    }, [ipps])

    // --- HELPER FUNCTIONS ---
    const getSubmitStatusBadge = (submitAt: string | null) => {
        if (submitAt) {
            return (
                <Badge variant="default" className="flex items-center gap-1 bg-blue-600">
                    <Send className="h-3 w-3" />
                    Submitted
                </Badge>
            )
        } else {
            return (
                <Badge variant="outline" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Draft
                </Badge>
            )
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                )
            case "VERIFIED":
            case "APPROVED":
                return (
                    <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                        <CheckCircle className="h-3 w-3" />
                        {status === "VERIFIED" ? "Verified" : "Approved"}
                    </Badge>
                )
            case "REJECTED":
                return (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Rejected
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    Main Menu
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    IPP
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Database</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto px-4">
                        <LogoutButton />
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">IPP Database</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                {/* Search Input */}
                                <div className="relative flex-grow sm:flex-grow-0 sm:max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Search IPP, NPK, Name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Year Filter */}
                                <Select value={yearFilter} onValueChange={setYearFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {uniqueYears.map(year => (
                                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Department Filter */}
                                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {uniqueDepartments.map(dept => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Submit Status Filter */}
                                <Select value={submitStatusFilter} onValueChange={setSubmitStatusFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Submit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Verify Status Filter */}
                                <Select value={verifyStatusFilter} onValueChange={setVerifyStatusFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Verify" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="VERIFIED">Verified</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Approval Status Filter */}
                                <Select value={approvalStatusFilter} onValueChange={setApprovalStatusFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Approval" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Refresh Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="flex items-center gap-2 ml-auto"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                    Refresh
                                </Button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>IPP ID</TableHead>
                                                <TableHead>NPK</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead className="text-center">Year</TableHead>
                                                <TableHead className="text-center">Submit Status</TableHead>
                                                <TableHead className="text-center">Verification</TableHead>
                                                <TableHead className="text-center">Approval</TableHead>
                                                <TableHead className="text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredIpps.length > 0 ? (
                                                filteredIpps.map((ipp) => (
                                                    <TableRow key={ipp.ipp}>
                                                        <TableCell>
                                                            <Badge variant="outline" className="font-mono">
                                                                {ipp.ipp || "N/A"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="font-mono">
                                                                {ipp.user?.npk || "N/A"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {ipp.user?.name || "N/A"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {ipp.user?.department?.name || "N/A"}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {ipp.year || "N/A"}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {getSubmitStatusBadge(ipp.submitAt)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {getStatusBadge(ipp.verify)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {getStatusBadge(ipp.approval)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button asChild variant="outline" size="sm" className="h-8 px-2">
                                                                <Link href={`/ipp/database/${ipp.ipp}`}>
                                                                    <Eye className="h-4 w-4 mr-1" /> View
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                                                        {loading ? "Loading data..." : "No IPP data found for the selected filters."}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Summary Stats */}
                            {!loading && filteredIpps.length > 0 && (
                                <div className="mt-4 text-sm text-muted-foreground">
                                    Showing {filteredIpps.length} of {ipps.length} IPPs
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}