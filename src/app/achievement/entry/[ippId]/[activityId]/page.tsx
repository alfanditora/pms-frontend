"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Loader2,
    ArrowLeft,
    Upload,
    Download,
    Trash2,
    CheckCircle,
    XCircle,
    Edit3,
    Calendar,
    Eye,
    ShieldCheck,
    AlertTriangle,
    File,
    Plus,
    Save,
    AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

// Type definitions - sesuai backend
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

type Achievement = {
    achievement_id: number
    activityId: number
    month: number
    achievement_value: number | null
    weightxvalue: number | null
    verify: "PENDING" | "VERIFIED" | "REJECTED"
    status: "COUNT" | "NOT_COUNT"
    createdAt: string
    updatedAt: string
}

// Backend mengembalikan evidence dengan file_path yang sudah full URL
type Evidence = {
    evidence_id: number
    achievementId: number
    file_path: string  // Sudah full URL dari backend
    createdAt: string
    updatedAt: string
}

type UserInfo = {
    npk: string
    name: string
    section?: string
    position?: string
    grade?: number
    departmentId?: number
    department?: {
        department_id: number
        name: string
    }
    privillege: "USER" | "OPERATION" | "ADMIN"
}

// Helper function untuk extract filename dari URL
const getFileNameFromPath = (filePath: string) => {
    if (!filePath) return 'Unknown file'
    const parts = filePath.split('/')
    const filename = parts[parts.length - 1] || 'Unknown file'
    try {
        return decodeURIComponent(filename)
    } catch {
        return filename
    }
}

// Check apakah file bisa di-preview
const isPreviewableFile = (filePath: string) => {
    const fileName = getFileNameFromPath(filePath).toLowerCase()
    return fileName.endsWith('.pdf') || fileName.match(/\.(jpeg|jpg|gif|png)$/)
}

export default function ActivityDetailPage() {
    const { ippId, activityId } = useParams<{ ippId: string; activityId: string }>()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [activity, setActivity] = useState<ActivityType | null>(null)
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [evidences, setEvidences] = useState<{ [monthId: number]: Evidence[] }>({})
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    const [achievementValue, setAchievementValue] = useState<string>("")
    const [countStatus, setCountStatus] = useState<"COUNT" | "NOT_COUNT">("NOT_COUNT")
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null)

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]

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

    const fetchActivityDetail = useCallback(async () => {
        if (!ippId || !activityId) return

        const token = getToken()
        if (!token) {
            setError("Token not found. Please login again.")
            router.push("/login")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const decoded = parseJwt(token)
            if (decoded?.npk) {
                const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pms-database.vercel.app'}/api/user/${decoded.npk}/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                })

                if (userRes.status === 401) {
                    setError("Session expired. Please login again.")
                    toast.error("Session expired. Please login again.")
                    router.push("/login")
                    return
                }

                if (userRes.ok) {
                    const userData = await userRes.json()
                    setCurrentUser(userData?.data || userData)
                }
            }

            const activitiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pms-database.vercel.app/'}/api/ipp/${ippId}/activities`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!activitiesRes.ok) {
                if (activitiesRes.status === 401) {
                    setError("Session expired. Please login again.")
                    router.push("/login")
                    return
                }
                throw new Error("Failed to fetch activities")
            }

            const activitiesData = await activitiesRes.json()
            const activitiesArray: ActivityType[] = Array.isArray(activitiesData) ? activitiesData : activitiesData?.data ?? []
            const foundActivity = activitiesArray.find(act => act.activity === activityId)

            if (!foundActivity) {
                throw new Error("Activity not found")
            }

            setActivity(foundActivity)

            const achievementsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pms-database.vercel.app'}/api/ipp/${ippId}/activities/${activityId}/achievements`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (achievementsRes.ok) {
                const achievementsData = await achievementsRes.json()
                const achievementsArray: Achievement[] = Array.isArray(achievementsData) ? achievementsData : achievementsData?.data ?? []
                setAchievements(achievementsArray)

                // Fetch evidences - backend mengembalikan file_path yang sudah full URL
                const evidencePromises = achievementsArray.map(async (achievement) => {
                    try {
                        const evidenceRes = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL || 'https://pms-database.vercel.app'}/api/ipp/${ippId}/activities/${activityId}/achievements/${achievement.month}/evidences`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                        if (evidenceRes.ok) {
                            const evidenceData = await evidenceRes.json()
                            const evidenceArray: Evidence[] = Array.isArray(evidenceData) ? evidenceData : evidenceData?.data ?? []
                            return { month: achievement.month, evidences: evidenceArray }
                        }
                        return { month: achievement.month, evidences: [] }
                    } catch (error) {
                        console.error(`Error fetching evidences for month ${achievement.month}:`, error)
                        return { month: achievement.month, evidences: [] }
                    }
                })

                const evidenceResults = await Promise.all(evidencePromises)
                const evidenceMap = evidenceResults.reduce((acc, result) => {
                    acc[result.month] = result.evidences
                    return acc
                }, {} as { [key: number]: Evidence[] })

                setEvidences(evidenceMap)
            }

            toast.success("Data loaded successfully")
        } catch (err: any) {
            console.error("Error loading activity detail:", err)
            const errorMessage = err?.message || "Failed to load activity detail"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [ippId, activityId, router])

    useEffect(() => {
        fetchActivityDetail()
    }, [fetchActivityDetail])

    const openMonthDialog = (month: number) => {
        const achievement = achievements.find(a => a.month === month)
        setSelectedMonth(month)
        setAchievementValue(achievement?.achievement_value?.toString() || "")
        setCountStatus(achievement?.status || "NOT_COUNT")
        setDialogOpen(true)
    }

    const updateAchievement = async () => {
        if (!selectedMonth) return
        const token = getToken()
        if (!token) return

        setActionLoading("update")
        try {
            const value = parseFloat(achievementValue) || 0
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pms-database.vercel.app'}/api/ipp/${ippId}/activities/${activityId}/achievements/${selectedMonth}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    achievement_value: value,
                    status: countStatus
                }),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => null)
                throw new Error(errorData?.message || "Failed to update achievement")
            }

            toast.success("Achievement updated successfully")
            await fetchActivityDetail()
        } catch (error: any) {
            console.error("Error updating achievement:", error)
            toast.error(error?.message || "Failed to update achievement")
        } finally {
            setActionLoading(null)
        }
    }

    const uploadEvidence = async (files: FileList | null) => {
        if (!files || !selectedMonth) return
        const token = getToken()
        if (!token) return

        setActionLoading("upload")
        try {
            const file = files[0]
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pms-database.vercel.app'}/api/ipp/${ippId}/activities/${activityId}/achievements/${selectedMonth}/evidences`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => null)
                throw new Error(errorData?.message || "Failed to upload evidence")
            }

            toast.success("Evidence uploaded successfully")
            await fetchActivityDetail()

            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        } catch (error: any) {
            console.error("Error uploading evidence:", error)
            toast.error(error?.message || "Failed to upload evidence")
        } finally {
            setActionLoading(null)
        }
    }

    const deleteEvidence = async (evidenceId: number) => {
        const token = getToken()
        if (!token) return

        setActionLoading(`delete-${evidenceId}`)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pms-database.vercel.app'}/api/ipp/evidences/${evidenceId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => null)
                throw new Error(errorData?.message || "Failed to delete evidence")
            }

            toast.success("Evidence deleted successfully")
            await fetchActivityDetail()
        } catch (error: any) {
            console.error("Error deleting evidence:", error)
            toast.error(error?.message || "Failed to delete evidence")
        } finally {
            setActionLoading(null)
        }
    }

    const verifyAchievement = async (month: number, status: "VERIFIED" | "REJECTED") => {
        const token = getToken()
        if (!token) return

        setActionLoading(`verify-${month}`)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pms-database.vercel.app'}/api/ipp/${ippId}/activities/${activityId}/achievements/${month}/verification`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => null)
                throw new Error(errorData?.message || "Failed to verify achievement")
            }

            toast.success(`Achievement successfully ${status === 'VERIFIED' ? 'verified' : 'rejected'}`)
            await fetchActivityDetail()
        } catch (error: any) {
            console.error("Error verifying achievement:", error)
            toast.error(error?.message || "Failed to verify achievement")
        } finally {
            setActionLoading(null)
        }
    }

    const getCategoryVariant = (category: string) => {
        switch (category) {
            case "ROUTINE":
                return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200"
            case "NON_ROUTINE":
                return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200"
            case "PROJECT":
                return "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200"
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
        }
    }

    const calculateScore = (value: number | null, weight: number) => {
        if (value === null || value === undefined) return "0.00"
        return ((value * weight)).toFixed(2)
    }

    const renderCountBadge = (status: "COUNT" | "NOT_COUNT" | undefined) => {
        if (!status) return <Badge variant="outline">-</Badge>

        switch (status) {
            case "COUNT":
                return (
                    <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 border-sky-200">
                        COUNT
                    </Badge>
                )
            case "NOT_COUNT":
                return (
                    <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200 border-gray-300">
                        NOT COUNT
                    </Badge>
                )
            default:
                return <Badge variant="outline">-</Badge>
        }
    }

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "VERIFIED":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {status}
                    </Badge>
                )
            case "PENDING":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {status}
                    </Badge>
                )
            case "REJECTED":
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        {status}
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const closeDialog = () => {
        setDialogOpen(false)
        setSelectedMonth(null)
        setAchievementValue("")
        setCountStatus("NOT_COUNT")
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    if (loading) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">Loading activity detail...</p>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
    }

    if (error || !activity) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <div className="text-center py-16">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-700 mb-2">An Error Occurred</h3>
                        <p className="text-red-600 mb-4">{error || "Activity not found"}</p>
                        <Button onClick={() => fetchActivityDetail()} variant="outline">
                            Try Again
                        </Button>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
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
                                    <BreadcrumbLink href="/achievement/entry">Entry</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href={`/achievement/entry/${ippId}`}>{ippId}</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Activity {activity.activity}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto px-4">
                        <LogoutButton />
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 w-fit"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                Activity Detail
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Activity</Label>
                                        <p className="text-lg font-semibold mt-1">{activity.activity}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Activity Name</Label>
                                        <p className="text-base mt-1">{activity.activity_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                                        <div className="mt-1">
                                            <Badge className={getCategoryVariant(activity.activity_category)} variant="outline">
                                                {activity.activity_category.replace("_", " ")}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Weight</Label>
                                        <p className="text-base font-semibold mt-1">{(activity.weight * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">KPI</Label>
                                        <p className="text-base mt-1">{activity.kpi}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Target</Label>
                                        <p className="text-base mt-1">{activity.target}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Deliverable</Label>
                                        <p className="text-base mt-1">{activity.deliverable}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Monthly Achievement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="text-center font-semibold">Month</TableHead>
                                            <TableHead className="text-center font-semibold">Achievement Value</TableHead>
                                            <TableHead className="text-center font-semibold">Score (Weight × Value)</TableHead>
                                            <TableHead className="text-center font-semibold">Count Status</TableHead>
                                            <TableHead className="text-center font-semibold">Evidence</TableHead>
                                            <TableHead className="text-center font-semibold">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                                            const achievement = achievements.find(a => a.month === month)
                                            const monthEvidences = evidences[month] || []
                                            return (
                                                <TableRow key={month} className={`hover:bg-muted/50 transition-colors ${month % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                                                    <TableCell className="font-medium text-center">{monthNames[month - 1]}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-medium">
                                                            {achievement?.achievement_value !== null && achievement?.achievement_value !== undefined 
                                                                ? achievement.achievement_value.toFixed(2) 
                                                                : "-"}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-semibold">
                                                            {calculateScore(achievement?.achievement_value || null, activity.weight)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {renderCountBadge(achievement?.status)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {monthEvidences.length > 0 ? (
                                                                <Badge variant="outline" className="text-xs">
                                                                    <File className="h-3 w-3 mr-1" />
                                                                    {monthEvidences.length} file(s)
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">No Evidence</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex gap-1 justify-center">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                onClick={() => openMonthDialog(month)} 
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Edit3 className="h-3 w-3" />
                                                                Input
                                                            </Button>
                                                            {/* Verification action buttons removed */}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    Input Achievement - {selectedMonth ? monthNames[selectedMonth - 1] : ""}
                                </DialogTitle>
                                <DialogDescription>
                                    Manage achievement and evidence for this month
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="achievement" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="achievement">Achievement</TabsTrigger>
                                    <TabsTrigger value="evidence">Evidence</TabsTrigger>
                                </TabsList>

                                <TabsContent value="achievement" className="space-y-4">
                                    <div className="space-y-6 pt-4">
                                        <div>
                                            <Label htmlFor="achievement-value">Achievement Value</Label>
                                            <Input
                                                id="achievement-value"
                                                type="number"
                                                value={achievementValue}
                                                onChange={(e) => setAchievementValue(e.target.value)}
                                                step="0.01"
                                                min="0"
                                                placeholder="Masukkan nilai pencapaian"
                                                className="mt-2"
                                            />
                                        </div>

                                        <div>
                                            <Label>Count Status</Label>
                                            <RadioGroup
                                                value={countStatus}
                                                onValueChange={(value: "COUNT" | "NOT_COUNT") => setCountStatus(value)}
                                                className="flex items-center gap-6 mt-2"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="COUNT" id="count-option" />
                                                    <Label htmlFor="count-option">COUNT</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="NOT_COUNT" id="not-count-option" />
                                                    <Label htmlFor="not-count-option">NOT COUNT</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        <div className="bg-muted/50 p-4 rounded-lg">
                                            <div className="text-sm space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Target:</span>
                                                    <span className="font-medium">{activity.target}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Weight:</span>
                                                    <span className="font-medium">{(activity.weight * 100).toFixed(1)}%</span>
                                                </div>
                                                {achievementValue && (
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span>Counted Score:</span>
                                                        <span className="font-bold text-primary">
                                                            {calculateScore(parseFloat(achievementValue) || 0, activity.weight)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={updateAchievement}
                                            disabled={actionLoading === "update" || !achievementValue}
                                            className="w-full"
                                        >
                                            {actionLoading === "update" ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Achievement
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="evidence" className="space-y-4">
                                    <div className="space-y-4 pt-4">
                                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                                            <div className="text-center space-y-4">
                                                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                                                <div>
                                                    <h3 className="font-medium">Upload New Evidence</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Choose file to upload
                                                    </p>
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={(e) => uploadEvidence(e.target.files)}
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar"
                                                />
                                                <Button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={actionLoading === "upload"}
                                                    variant="outline"
                                                >
                                                    {actionLoading === "upload" ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Choose File
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-3">All Evidences</h4>
                                            {selectedMonth && evidences[selectedMonth]?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {evidences[selectedMonth].map((evidence) => (
                                                        <div key={evidence.evidence_id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-sm truncate" title={getFileNameFromPath(evidence.file_path)}>
                                                                        {getFileNameFromPath(evidence.file_path)}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Upload: {new Date(evidence.createdAt).toLocaleDateString('id-ID')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 flex-shrink-0">
                                                                {isPreviewableFile(evidence.file_path) && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setPreviewFileUrl(evidence.file_path)}
                                                                        title="Preview file"
                                                                    >
                                                                        <Eye className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => window.open(evidence.file_path, '_blank')}
                                                                    title="Download file"
                                                                >
                                                                    <Download className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => deleteEvidence(evidence.evidence_id)}
                                                                    disabled={actionLoading === `delete-${evidence.evidence_id}`}
                                                                    title="Hapus file"
                                                                >
                                                                    {actionLoading === `delete-${evidence.evidence_id}` ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p>No evidence uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <DialogFooter>
                                <Button variant="outline" onClick={closeDialog}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={!!previewFileUrl} onOpenChange={(open) => !open && setPreviewFileUrl(null)}>
                        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-0">
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle>{getFileNameFromPath(previewFileUrl || '')}</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 p-2 overflow-auto">
                                {previewFileUrl?.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={previewFileUrl}
                                        className="w-full h-full"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    previewFileUrl ? (
                                        <img
                                            src={previewFileUrl}
                                            alt="Image Preview"
                                            className="max-w-full max-h-full object-contain mx-auto"
                                        />
                                    ) : null
                                )}
                            </div>
                            <DialogFooter className="p-4 border-t">
                                <Button 
                                    variant="outline" 
                                    onClick={() => window.open(previewFileUrl || '', '_blank')}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                                <Button variant="outline" onClick={() => setPreviewFileUrl(null)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}