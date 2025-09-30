"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
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
import { Loader2, Activity, ArrowLeft, Search, CheckCircle, XCircle, ShieldCheck, UserCheck, AlertCircle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Type definitions (unchanged)
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
    createdAt?: string
    updatedAt?: string
    user?: UserInfo
    category?: CategoryInfo
}

export default function Page() {
    const { ippId } = useParams<{ ippId: string }>()
    const router = useRouter()

    const [ipp, setIpp] = useState<IppInfo | null>(null)
    const [activities, setActivities] = useState<ActivityType[]>([])
    const [filteredActivities, setFilteredActivities] = useState<ActivityType[]>([])
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [isActionLoading, setIsActionLoading] = useState(false)
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

    const fetchAllData = useCallback(async () => {
        if (!ippId) return

        setLoading(true)
        setError(null)

        const token = getToken()
        if (!token) {
            setError("Authentication required.")
            setLoading(false)
            return
        }

        try {
            // decode npk dari token
            const decoded = parseJwt(token)
            if (!decoded?.npk) {
                throw new Error("Token tidak berisi NPK")
            }

            // fetch utama
            const [ippRes, actsRes, meRes] = await Promise.all([
                fetch(`http://localhost:4000/api/ipp/${ippId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`http://localhost:4000/api/ipp/${ippId}/activities`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`http://localhost:4000/api/user/${decoded.npk}/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ])

            if (!ippRes.ok) throw new Error(`Failed to fetch IPP info: ${ippRes.statusText}`)
            if (!actsRes.ok) throw new Error(`Failed to fetch activities: ${actsRes.statusText}`)

            // current user
            if (meRes.ok) {
                const meData = await meRes.json()
                setCurrentUser(meData?.data ? meData.data : meData)
            } else {
                console.warn("Could not fetch current user profile.")
            }

            // ipp info
            const ippDataRaw = await ippRes.json()
            const ippData: IppInfo = ippDataRaw?.data ? ippDataRaw.data : ippDataRaw

            // activities
            const actsData = await actsRes.json()
            const actsArray: ActivityType[] = Array.isArray(actsData)
                ? actsData
                : actsData?.data ?? []

            // lengkapi data user & category
            let userInfo = ippData.user
            let categoryInfo = ippData.category

            if (!userInfo && ippData.npk) {
                const userRes = await fetch(
                    `http://localhost:4000/api/user/${ippData.npk}/profile`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                if (userRes.ok) {
                    const userData = await userRes.json()
                    userInfo = userData?.data ? userData.data : userData
                }
            }

            if (!categoryInfo && ippData.categoryId) {
                const categoryRes = await fetch(
                    `http://localhost:4000/api/category/find/${ippData.categoryId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                if (categoryRes.ok) {
                    const categoryData = await categoryRes.json()
                    categoryInfo = categoryData?.data ? categoryData.data : categoryData
                }
            }

            if (
                userInfo &&
                userInfo.departmentId &&
                (!userInfo.department || !userInfo.department.name)
            ) {
                const deptRes = await fetch(
                    `http://localhost:4000/api/department/find/${userInfo.departmentId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                if (deptRes.ok) {
                    const deptData = await deptRes.json()
                    userInfo.department = deptData?.data ? deptData.data : deptData
                }
            }

            setIpp({ ...ippData, user: userInfo, category: categoryInfo })
            setActivities(actsArray)
            setFilteredActivities(actsArray)
        } catch (err: any) {
            console.error("Error loading IPP detail:", err)
            setError(err?.message || "Failed to load IPP detail")
            toast.error("Failed to load IPP detail")
        } finally {
            setLoading(false)
        }
    }, [ippId])

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    useEffect(() => {
        if (!searchTerm) {
            setFilteredActivities(activities)
            return
        }
        const q = searchTerm.toLowerCase()
        setFilteredActivities(
            activities.filter(
                (a) =>
                    (a.activity_name && a.activity_name.toLowerCase().includes(q)) ||
                    (a.activity && a.activity.toLowerCase().includes(q)) ||
                    (a.kpi && a.kpi.toLowerCase().includes(q))
            )
        )
    }, [searchTerm, activities])

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Not submitted"
        try {
            return new Date(dateString).toLocaleString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
            })
        } catch { return dateString }
    }

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "VERIFIED":
            case "APPROVED":
                return <Badge className="bg-green-100 text-green-800">{status}</Badge>
            case "PENDING":
                return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>
            case "REJECTED":
                return <Badge className="bg-red-100 text-red-800">{status}</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
        }
    }

    const getCategoryVariant = (category: string) => {
        switch (category) {
            case "ROUTINE": return "default"
            case "NON_ROUTINE": return "secondary"
            case "PROJECT": return "destructive"
            default: return "outline"
        }
    }

    const handleIppAction = async (
        action: "verification" | "approval",
        status: "VERIFIED" | "APPROVED" | "REJECTED"
    ) => {
        setIsActionLoading(true)
        const token = getToken()
        if (!token) {
            toast.error("Authentication required.")
            setIsActionLoading(false)
            return
        }

        try {
            const res = await fetch(`http://localhost:4000/api/ipp/${ippId}/${action}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: res.statusText }))
                throw new Error(errorData.message || `Failed to perform action.`)
            }

            toast.success(`IPP has been successfully ${status.toLowerCase()}.`)
            await fetchAllData() // Refetch all data to show updated status

        } catch (err: any) {
            console.error(`Error during IPP ${action}:`, err)
            toast.error(err.message || `An error occurred during the ${action} process.`)
        } finally {
            setIsActionLoading(false)
        }
    }

    // Helper function to determine what actions can be taken
    const getAvailableActions = () => {
        if (!ipp || !ipp.submitAt) return { canVerify: false, canApprove: false }

        const canVerify = ipp.verify === 'PENDING'
        const canApprove = ipp.verify === 'VERIFIED' && ipp.approval === 'PENDING'

        return { canVerify, canApprove }
    }

    // Helper function to get status message
    const getStatusMessage = () => {
        if (!ipp) return ""

        if (!ipp.submitAt) {
            return "IPP has not been submitted yet. Actions will be available after submission."
        }

        if (ipp.verify === 'REJECTED') {
            return "IPP verification has been rejected. No further actions available."
        }

        if (ipp.approval === 'REJECTED') {
            return "IPP approval has been rejected. No further actions available."
        }

        if (ipp.verify === 'PENDING') {
            return "IPP is waiting for verification."
        }

        if (ipp.verify === 'VERIFIED' && ipp.approval === 'PENDING') {
            return "IPP has been verified and is waiting for approval."
        }

        if (ipp.verify === 'VERIFIED' && ipp.approval === 'APPROVED') {
            return "IPP has been fully processed (verified and approved)."
        }

        return ""
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>Main Menu</BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>IPP</BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem><BreadcrumbLink href="/ipp/submission">Submission</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem><BreadcrumbPage>{ippId}</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto px-4"><LogoutButton /></div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <p className="text-red-500">{error}</p>
                            <Button variant="outline" onClick={() => fetchAllData()} className="mt-4">Retry</Button>
                        </div>
                    ) : ipp ? (
                        <>
                            <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-2 w-fit">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>

                            {/* IPP Info Card */}
                            <Card className="pb-0">
                                <CardHeader><CardTitle className="text-2xl">IPP Information</CardTitle></CardHeader>
                                <CardContent className="pb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Basic IPP Info */}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">IPP ID</p>
                                                <p className="text-base font-semibold">{ipp.ipp}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Year</p>
                                                <p className="text-base">{ipp.year}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                                                <p className="text-base font-semibold">{activities.length}</p>
                                            </div>
                                        </div>

                                        {/* User Info */}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Employee</p>
                                                <p className="text-base font-semibold">{ipp.user?.name || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">NPK: {ipp.npk}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Position</p>
                                                <p className="text-base">{ipp.user?.position || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">Grade: {ipp.user?.grade || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Department</p>
                                                <p className="text-base">{ipp.user?.department?.name || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">Section: {ipp.user?.section || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Category & Status Info */}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Category</p>
                                                <p className="text-base font-semibold">{ipp.category?.name || 'Unknown'}</p>
                                                {ipp.category && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        <p>Routine: {(ipp.category.routine * 100).toFixed(0)}%</p>
                                                        <p>Non-Routine: {(ipp.category.non_routine * 100).toFixed(0)}%</p>
                                                        <p>Project: {(ipp.category.project * 100).toFixed(0)}%</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Submit Status</p>
                                                <Badge className={ipp.submitAt ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                                                    {ipp.submitAt ? `Submitted at ${formatDate(ipp.submitAt)}` : "Not submitted"}
                                                </Badge>
                                            </div>
                                            <div><p className="text-sm font-medium text-muted-foreground">Verify</p>{renderStatusBadge(ipp.verify)}</div>
                                            <div><p className="text-sm font-medium text-muted-foreground">Approval</p>{renderStatusBadge(ipp.approval)}</div>
                                        </div>
                                    </div>
                                </CardContent>

                                {/* ACTION BUTTONS FOR ADMIN/OPERATION */}
                                {currentUser && (currentUser.privillege === 'ADMIN' || currentUser.privillege === 'OPERATION') && (
                                    <CardFooter className="flex flex-col gap-4 pt-6 border-t bg-muted/50 p-4">
                                        {/* Status Message */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg w-full">
                                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                            <p>{getStatusMessage()}</p>
                                        </div>

                                        {/* Action Buttons */}
                                        {(() => {
                                            const { canVerify, canApprove } = getAvailableActions()

                                            if (!canVerify && !canApprove) {
                                                return null
                                            }

                                            return (
                                                <div className="flex flex-wrap gap-4 w-full">
                                                    {/* Verification Actions */}
                                                    {canVerify && (
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm mr-2 flex items-center gap-2">
                                                                <ShieldCheck className="h-4 w-4" /> Verification:
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 gap-2"
                                                                onClick={() => handleIppAction('verification', 'VERIFIED')}
                                                                disabled={isActionLoading}
                                                            >
                                                                {isActionLoading ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4" /> Verify
                                                                    </>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="gap-2"
                                                                onClick={() => handleIppAction('verification', 'REJECTED')}
                                                                disabled={isActionLoading}
                                                            >
                                                                {isActionLoading ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="h-4 w-4" /> Reject
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Approval Actions */}
                                                    {canApprove && (
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm mr-2 flex items-center gap-2">
                                                                <UserCheck className="h-4 w-4" /> Approval:
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 gap-2"
                                                                onClick={() => handleIppAction('approval', 'APPROVED')}
                                                                disabled={isActionLoading}
                                                            >
                                                                {isActionLoading ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4" /> Approve
                                                                    </>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="gap-2"
                                                                onClick={() => handleIppAction('approval', 'REJECTED')}
                                                                disabled={isActionLoading}
                                                            >
                                                                {isActionLoading ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="h-4 w-4" /> Reject
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </CardFooter>
                                )}
                            </Card>

                            {/* Search and Activities Table */}
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search activities by name, key or KPI..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Activity className="h-5 w-5" />
                                            Activities
                                        </span>
                                        {ipp?.approval === 'APPROVED' && (
                                            <Badge className="bg-green-100 text-green-800">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Details Available
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {filteredActivities.length > 0 ? (
                                        <div className="rounded-md border overflow-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/50"><TableHead className="w-[100px]">Activity</TableHead><TableHead>Activity Name</TableHead><TableHead>KPI</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Weight (%)</TableHead><TableHead>Target</TableHead><TableHead>Deliverable</TableHead></TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredActivities.map((activity) => (
                                                        <TableRow key={activity.id}>
                                                            <TableCell className="font-medium">{activity.activity}</TableCell>
                                                            <TableCell><p className="font-medium">{activity.activity_name}</p></TableCell>
                                                            <TableCell><p className="text-sm text-muted-foreground max-w-[200px] truncate">{activity.kpi}</p></TableCell>
                                                            <TableCell>
                                                                <Badge variant={getCategoryVariant(activity.activity_category)}>
                                                                    {activity.activity_category.replace("_", " ")}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right"><span className="font-medium">{(activity.weight * 100).toFixed(1)}%</span></TableCell>
                                                            <TableCell><p className="text-sm max-w-[150px] truncate">{activity.target}</p></TableCell>
                                                            <TableCell><p className="text-sm max-w-[150px] truncate">{activity.deliverable}</p></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <p className="mt-2 text-muted-foreground">No activities found for this IPP.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <p className="text-center text-muted-foreground">IPP not found.</p>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}