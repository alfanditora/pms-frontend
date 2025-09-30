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
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Loader2,
    ArrowLeft,
    Download,
    CheckCircle,
    XCircle,
    Eye,
    AlertCircle,
    File,
    MoreVertical,
    Shield,
    TrendingUp,
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
    id: number
    ippId: string
    activityId: number
    month: number
    value: number | null
    score: number | null
    status: "COUNT" | "NOT_COUNT"
    createdAt: string
    updatedAt: string
}

// Backend mengembalikan evidence dengan struktur ini
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

// Helper function untuk extract filename dari URL
const getFileNameFromUrl = (url: string) => {
    if (!url) return 'Unknown file'
    const parts = url.split('/')
    const filename = parts[parts.length - 1] || 'Unknown file'
    try {
        return decodeURIComponent(filename)
    } catch {
        return filename
    }
}

// Check apakah file bisa di-preview
const isPreviewableFile = (url: string) => {
    const lowerUrl = url.toLowerCase()
    return lowerUrl.endsWith('.pdf') || lowerUrl.match(/\.(jpeg|jpg|gif|png)$/)
}

export default function ActivityDetailPage() {
    const { ippId, activityId } = useParams<{ ippId: string; activityId: string }>()
    const router = useRouter()

    const [activity, setActivity] = useState<ActivityType | null>(null)
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [evidences, setEvidences] = useState<{ [monthId: number]: Evidence[] }>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]

    const getToken = () => {
        const cookies = document.cookie.split(";")
        const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("token="))
        return tokenCookie ? tokenCookie.split("=")[1] : null
    }

    const fetchUserInfo = useCallback(async () => {
        const token = getToken()
        if (!token) return

        try {
            let userNpk
            const tokenParts = token.split('.')
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]))
                userNpk = payload.npk || payload.sub || payload.userId
            }

            if (!userNpk) return

            const response = await fetch(`http://localhost:4000/api/user/${userNpk}/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            })

            if (response.ok) {
                const userData = await response.json()
                if (userData && userData.privillege) {
                    setUserInfo(userData)
                }
            }
        } catch (error) {
            console.error("Error fetching user info:", error)
        }
    }, [])

    const fetchActivityDetail = useCallback(async () => {
        if (!ippId || !activityId) return

        const token = getToken()
        if (!token) {
            setError("Authentication required.")
            return
        }

        setLoading(true)
        try {
            const activitiesRes = await fetch(`http://localhost:4000/api/ipp/${ippId}/activities`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!activitiesRes.ok) throw new Error("Failed to fetch activities")

            const activitiesData = await activitiesRes.json()
            const activitiesArray: ActivityType[] = Array.isArray(activitiesData) ? activitiesData : activitiesData?.data ?? []
            const foundActivity = activitiesArray.find(act => act.activity === activityId)

            if (!foundActivity) throw new Error("Activity not found")

            setActivity(foundActivity)

            const achievementsRes = await fetch(`http://localhost:4000/api/ipp/${ippId}/activities/${activityId}/achievements`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (achievementsRes.ok) {
                const achievementsData = await achievementsRes.json()
                const rawAchievements: any[] = Array.isArray(achievementsData) ? achievementsData : achievementsData?.data ?? []

                const transformedAchievements: Achievement[] = rawAchievements.map(apiAchievement => ({
                    id: apiAchievement.achievement_id,
                    ippId: ippId,
                    activityId: apiAchievement.activityId,
                    month: apiAchievement.month,
                    value: apiAchievement.achievement_value,
                    score: apiAchievement.weightxvalue,
                    verify: apiAchievement.verify,
                    status: apiAchievement.status,
                    createdAt: apiAchievement.uploaded_at,
                    updatedAt: apiAchievement.uploaded_at,
                }))

                setAchievements(transformedAchievements)

                // Fetch evidences - backend returns full URLs
                const evidencePromises = transformedAchievements.map(async (achievement) => {
                    try {
                        const evidenceRes = await fetch(
                            `http://localhost:4000/api/ipp/${ippId}/activities/${activityId}/achievements/${achievement.month}/evidences`,
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

        } catch (err: any) {
            console.error("Error loading activity detail:", err)
            setError(err?.message || "Failed to load activity detail")
            toast.error("Failed to load activity detail")
        } finally {
            setLoading(false)
        }
    }, [ippId, activityId])

    useEffect(() => {
        fetchUserInfo()
        fetchActivityDetail()
    }, [fetchUserInfo, fetchActivityDetail])

    const getCategoryVariant = (category: string) => {
        switch (category) {
            case "ROUTINE": return "default"
            case "NON_ROUTINE": return "secondary"
            case "PROJECT": return "destructive"
            default: return "outline"
        }
    }

    const calculateScore = (value: number | null, weight: number) => {
        if (value === null || value === undefined) return "0.00"
        return (value * weight).toFixed(2)
    }

    const renderCountBadge = (count: string) => {
        switch (count) {
            case "COUNT":
                return <Badge className="bg-blue-100 text-blue-800">COUNT</Badge>
            case "NOT_COUNT":
                return <Badge className="bg-gray-100 text-gray-800">NOT COUNT</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800">-</Badge>
        }
    }

    if (loading) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                        <p className="text-red-500">{error || "Activity not found"}</p>
                        <Button variant="outline" onClick={() => fetchActivityDetail()} className="mt-4">
                            Retry
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
                                <BreadcrumbItem>Main Menu</BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>IPP</BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/ipp/monitoring">Monitoring</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href={`/ipp/monitoring/${ippId}`}>{ippId}</BreadcrumbLink>
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
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                Activity Detail
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Activity Code</p>
                                        <p className="text-lg font-semibold">{activity.activity}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Activity Name</p>
                                        <p className="text-base">{activity.activity_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                                        <Badge variant={getCategoryVariant(activity.activity_category)}>
                                            {activity.activity_category.replace("_", " ")}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Weight</p>
                                        <p className="text-base font-semibold">{(activity.weight * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">KPI</p>
                                        <p className="text-base">{activity.kpi}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Target</p>
                                        <p className="text-base">{activity.target}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Deliverable</p>
                                        <p className="text-base">{activity.deliverable}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Monthly Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="text-center">Month</TableHead>
                                            <TableHead className="text-center">Achievement Value</TableHead>
                                            <TableHead className="text-center">Score (Weight × Value)</TableHead>
                                            <TableHead className="text-center">Count Status</TableHead>
                                            <TableHead className="text-center">Evidence</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                                            const achievement = achievements.find(a => a.month === month)
                                            const monthEvidences = evidences[month] || []

                                            return (
                                                <TableRow key={month}>
                                                    <TableCell className="font-medium text-center">
                                                        {monthNames[month - 1]}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        {achievement?.value !== null && achievement?.value !== undefined
                                                            ? achievement.value.toFixed(2)
                                                            : "-"}%
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-semibold">
                                                            {calculateScore(achievement?.value || null, activity.weight)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {achievement ? renderCountBadge(achievement.status) : (
                                                            <Badge variant="outline">-</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {monthEvidences.length > 0 ? (
                                                                monthEvidences.map((evidence) => (
                                                                    <Badge key={evidence.evidence_id} variant="outline" className="text-xs">
                                                                        <File className="h-3 w-3 mr-1" />
                                                                        {getFileNameFromUrl(evidence.file_path)}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">No evidence</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex gap-1 justify-center">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button size="sm" variant="outline">
                                                                        <Eye className="h-3 w-3" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-2xl">
                                                                    <DialogHeader>
                                                                        <DialogTitle>
                                                                            Evidence for {monthNames[month - 1]}
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            View evidence files for this month
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4">
                                                                        {monthEvidences.length > 0 ? (
                                                                            monthEvidences.map((evidence) => (
                                                                                <div key={evidence.evidence_id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <File className="h-5 w-5" />
                                                                                        <div>
                                                                                            <p className="font-medium">{getFileNameFromUrl(evidence.file_path)}</p>
                                                                                            <p className="text-xs text-muted-foreground">
                                                                                                Uploaded: {new Date(evidence.createdAt).toLocaleDateString('id-ID')}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex gap-2">
                                                                                        {isPreviewableFile(evidence.file_path) && (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="outline"
                                                                                                onClick={() => window.open(evidence.file_path, '_blank')}
                                                                                            >
                                                                                                <Eye className="h-3 w-3 mr-1" />
                                                                                                Preview
                                                                                            </Button>
                                                                                        )}
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            onClick={() => window.open(evidence.file_path, '_blank')}
                                                                                        >
                                                                                            <Download className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-center text-muted-foreground py-8">
                                                                                No evidence uploaded for this month
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
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
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}