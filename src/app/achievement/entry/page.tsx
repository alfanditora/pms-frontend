"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/navbar/logout"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Loader2,
    Activity,
    Search,
    CheckCircle,
    Eye,
    Trophy,
    Calendar,
    User,
    Target,
    RefreshCw,
    Filter,
    AlertTriangle,
    Award
} from "lucide-react"
import { toast } from "sonner"

// Type definitions
type ActivityType = {
    id: number
    activity: string
    activity_category: "ROUTINE" | "NON_ROUTINE" | "PROJECT"
    activity_name: string
    kpi: string
    weight: number
    target: string
    deliverable: string
    ippId: string
}

type UserInfo = {
    npk: string
    name: string
    section: string
    position: string
    grade: number
    departmentId: number
    department: {
        department_id: number
        name: string
    }
    privillege: "USER" | "OPERATION" | "ADMIN"
}

type CategoryInfo = {
    category_id: number
    name: string
    routine: number
    non_routine: number
    project: number
}

type IppInfo = {
    ipp: string
    year: number
    npk: string
    categoryId: number
    submitAt: string | null
    verify: "PENDING" | "VERIFIED" | "REJECTED"
    approval: "PENDING" | "APPROVED" | "REJECTED"
    createAt?: string
    updateAt?: string
    user?: UserInfo
    category?: CategoryInfo
    activities?: ActivityType[]
}

export default function AchievementEntryPage() {
    const router = useRouter()

    const [approvedIpps, setApprovedIpps] = useState<IppInfo[]>([])
    const [filteredIpps, setFilteredIpps] = useState<IppInfo[]>([])
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [yearFilter, setYearFilter] = useState<string>("all")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const getToken = () => {
        const cookies = document.cookie.split(";")
        const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("token="))
        return tokenCookie ? tokenCookie.split("=")[1] : null
    }

    const parseJwt = (token: string) => {
        try {
            return JSON.parse(atob(token.split(".")[1]))
        } catch (e) {
            console.error("Failed to parse token", e)
            return null
        }
    }

    const fetchApprovedIpps = useCallback(async () => {
        setLoading(true)
        setError(null)

        const token = getToken()
        if (!token) {
            setError("Token not found. Please login again.")
            toast.error("Session expired. Please login again.")
            router.push("/login")
            return
        }

        try {
            // Decode NPK from token
            const decoded = parseJwt(token)
            if (!decoded?.npk) {
                throw new Error("Token does not contain a valid NPK")
            }

            // Fetch current user profile and approved IPPs
            const [userRes, ippsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/user/${decoded.npk}/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/ipp/user/${decoded.npk}/approved`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ])

            // Handle authentication errors
            if (userRes.status === 401 || ippsRes.status === 401) {
                setError("Session expired. Please login again.")
                toast.error("Session expired. Please login again.")
                router.push("/login")
                return
            }

            // Handle user profile
            if (userRes.ok) {
                const userData = await userRes.json()
                setCurrentUser(userData?.data || userData)
            } else {
                console.warn("Could not fetch current user profile.")
            }

            // Handle approved IPPs
            if (!ippsRes.ok) {
                const errorData = await ippsRes.json().catch(() => null)
                throw new Error(errorData?.message || `HTTP ${ippsRes.status}: Failed to fetch approved IPPs`)
            }

            const ippsDataRaw = await ippsRes.json()
            const ippsData: IppInfo[] = Array.isArray(ippsDataRaw)
                ? ippsDataRaw
                : ippsDataRaw?.data || []

            // For each IPP, fetch additional details if needed
            const enrichedIpps = await Promise.all(
                ippsData.map(async (ipp) => {
                    let enrichedIpp = { ...ipp }

                    // Fetch activities for this IPP
                    try {
                        const activitiesRes = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/ipp/${ipp.ipp}/activities`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                        if (activitiesRes.ok) {
                            const activitiesData = await activitiesRes.json()
                            const activities: ActivityType[] = Array.isArray(activitiesData)
                                ? activitiesData
                                : activitiesData?.data || []
                            enrichedIpp.activities = activities
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch activities for IPP ${ipp.ipp}:`, err)
                        enrichedIpp.activities = []
                    }

                    // Fetch category info if not present
                    if (!enrichedIpp.category && enrichedIpp.categoryId) {
                        try {
                            const categoryRes = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/category/find/${enrichedIpp.categoryId}`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            )
                            if (categoryRes.ok) {
                                const categoryData = await categoryRes.json()
                                enrichedIpp.category = categoryData?.data || categoryData
                            }
                        } catch (err) {
                            console.warn(`Failed to fetch category for IPP ${ipp.ipp}:`, err)
                        }
                    }

                    return enrichedIpp
                })
            )

            setApprovedIpps(enrichedIpps)
            toast.success("IPP data loaded successfully")
        } catch (err: any) {
            console.error("Error loading approved IPPs:", err)
            const errorMessage = err?.message || "Failed to load approved IPP data"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [router])

    // Enhanced filtering logic
    useEffect(() => {
        let filtered = approvedIpps

        // Search filter
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase()
            filtered = filtered.filter(
                (ipp) =>
                    ipp.ipp.toLowerCase().includes(q) ||
                    ipp.year.toString().includes(q) ||
                    (ipp.category?.name && ipp.category.name.toLowerCase().includes(q)) ||
                    (ipp.activities && ipp.activities.some(activity =>
                        activity.activity_name.toLowerCase().includes(q) ||
                        activity.activity.toLowerCase().includes(q) ||
                        activity.kpi.toLowerCase().includes(q)
                    ))
            )
        }

        // Year filter
        if (yearFilter !== "all") {
            filtered = filtered.filter(ipp => ipp.year.toString() === yearFilter)
        }

        // Category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter(ipp => ipp.category?.name === categoryFilter)
        }

        setFilteredIpps(filtered)
    }, [searchTerm, yearFilter, categoryFilter, approvedIpps])

    useEffect(() => {
        fetchApprovedIpps()
    }, [fetchApprovedIpps])

    const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not submitted yet"
        try {
            return new Date(dateString).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch {
            return "Invalid date format"
        }
    }

    const getCategoryBadgeVariant = (category: string) => {
        switch (category) {
            case "ROUTINE":
                return "bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-300"
            case "NON_ROUTINE":
                return "bg-gray-700 text-white hover:bg-gray-800 border-gray-600"
            case "PROJECT":
                return "bg-black text-white hover:bg-gray-900 border-gray-800"
            default:
                return "bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-400"
        }
    }

    const getTotalActivitiesByCategory = (activities: ActivityType[]) => {
        const summary = {
            ROUTINE: 0,
            NON_ROUTINE: 0,
            PROJECT: 0,
            total: activities.length
        }

        activities.forEach(activity => {
            summary[activity.activity_category]++
        })

        return summary
    }

    const handleRefresh = () => {
        fetchApprovedIpps()
    }

    // Get unique years and categories for filters
    const availableYears = [...new Set(approvedIpps.map(ipp => ipp.year))].sort((a, b) => b - a)
    const availableCategories = [...new Set(approvedIpps.map(ipp => ipp.category?.name).filter((name): name is string => typeof name === "string"))]

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {/* Header */}
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">Main Menu</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/achievement">Achievement</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Entry</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto px-4">
                        <LogoutButton />
                    </div>
                </header>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">Loading approved IPP data...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-red-700 mb-2">An Error Occurred</h3>
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={handleRefresh} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <>

                            {/* Filters Section */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <div>
                                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                            Achievement Entry
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Manage achievements for approved IPPs
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={loading}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                        Refresh
                                    </Button>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Enhanced Filters */}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                            <Input
                                                placeholder="Search IPP, activity, or KPI..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>

                                        {availableYears.length > 0 && (
                                            <Select value={yearFilter} onValueChange={setYearFilter}>
                                                <SelectTrigger className="w-full sm:w-[120px]">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Years</SelectItem>
                                                    {availableYears.map(year => (
                                                        <SelectItem key={year} value={year.toString()}>
                                                            {year}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {availableCategories.length > 0 && (
                                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <Filter className="h-4 w-4 mr-2" />
                                                    <SelectValue placeholder="Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Categories</SelectItem>
                                                    {availableCategories.map(category => (
                                                        <SelectItem key={category} value={category}>
                                                            {category}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>

                                    {/* Results Info */}
                                    {!loading && (
                                        <div className="text-sm text-muted-foreground">
                                            Showing {filteredIpps.length} of {approvedIpps.length} approved IPP
                                        </div>
                                    )}

                                    {/* IPPs Table */}
                                    {filteredIpps.length > 0 ? (
                                        <div className="border rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/50">
                                                        <TableHead className="font-semibold">IPP ID</TableHead>
                                                        <TableHead className="text-center font-semibold">Year</TableHead>
                                                        <TableHead className="font-semibold">Category</TableHead>
                                                        <TableHead className="text-center font-semibold">Total Activities</TableHead>
                                                        <TableHead className="text-center font-semibold">Breakdown</TableHead>
                                                        <TableHead className="text-center font-semibold">Submit Date</TableHead>
                                                        <TableHead className="text-center font-semibold">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredIpps.map((ipp, index) => {
                                                        const activitySummary = getTotalActivitiesByCategory(ipp.activities || [])
                                                        return (
                                                            <TableRow
                                                                key={ipp.ipp}
                                                                className={`hover:bg-muted/50 transition-colors ${index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                                                    }`}
                                                            >
                                                                <TableCell className="font-medium">
                                                                    <Badge variant="outline" className="font-mono text-xs">
                                                                        {ipp.ipp}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Badge variant="outline">
                                                                        {ipp.year}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div>
                                                                        <p className="font-medium text-sm">{ipp.category?.name || 'Unknown'}</p>
                                                                        {ipp.category && (
                                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                                R: {(ipp.category.routine * 100).toFixed(0)}% •
                                                                                NR: {(ipp.category.non_routine * 100).toFixed(0)}% •
                                                                                P: {(ipp.category.project * 100).toFixed(0)}%
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <span className="font-semibold">{activitySummary.total}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex gap-1 flex-wrap justify-center">
                                                                        {activitySummary.ROUTINE > 0 && (
                                                                            <Badge className={getCategoryBadgeVariant("ROUTINE")} variant="outline">
                                                                                R: {activitySummary.ROUTINE}
                                                                            </Badge>
                                                                        )}
                                                                        {activitySummary.NON_ROUTINE > 0 && (
                                                                            <Badge className={getCategoryBadgeVariant("NON_ROUTINE")} variant="outline">
                                                                                NR: {activitySummary.NON_ROUTINE}
                                                                            </Badge>
                                                                        )}
                                                                        {activitySummary.PROJECT > 0 && (
                                                                            <Badge className={getCategoryBadgeVariant("PROJECT")} variant="outline">
                                                                                P: {activitySummary.PROJECT}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <div className="text-sm">{formatDate(ipp.submitAt)}</div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => router.push(`/achievement/entry/${ipp.ipp}`)}
                                                                        className="flex items-center gap-2 h-8 px-3"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                        Entry
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <div className="flex flex-col items-center">
                                                <div className="rounded-full bg-muted p-4 mb-4">
                                                    {searchTerm || yearFilter !== "all" || categoryFilter !== "all" ? (
                                                        <Search className="h-8 w-8 text-muted-foreground" />
                                                    ) : (
                                                        <Trophy className="h-8 w-8 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-lg mb-2">
                                                    {searchTerm || yearFilter !== "all" || categoryFilter !== "all"
                                                        ? "No matching IPP found"
                                                        : "No approved IPP yet"
                                                    }
                                                </h3>
                                                <p className="text-muted-foreground text-sm text-center max-w-md">
                                                    {searchTerm || yearFilter !== "all" || categoryFilter !== "all"
                                                        ? "Try changing your filter or search keyword to find the desired IPP"
                                                        : "You do not have any approved IPP yet. Please wait for your IPP approval or contact your supervisor."
                                                    }
                                                </p>
                                                {(searchTerm || yearFilter !== "all" || categoryFilter !== "all") && (
                                                    <Button
                                                        variant="outline"
                                                        className="mt-4"
                                                        onClick={() => {
                                                            setSearchTerm("")
                                                            setYearFilter("all")
                                                            setCategoryFilter("all")
                                                        }}
                                                    >
                                                        Reset Filter
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}