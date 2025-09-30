"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible"
import { toast } from "sonner"
import { ArrowLeft, Loader2, PlusCircle, Trash2, ChevronUp, ChevronDown } from "lucide-react"

// --- TYPE DEFINITIONS ---
type ActivityInput = {
    activity: string
    activity_category: 'ROUTINE' | 'NON_ROUTINE' | 'PROJECT'
    activity_name: string
    kpi: string
    weight: number
    target: string
    deliverable: string
}

type Category = {
    category_id: number
    name: string
    routine?: number
    non_routine?: number
    project?: number
}

const FloatingWeightSummary = ({
    total,
    byCategory,
    categoryDetails,
}: {
    total: number
    byCategory: { ROUTINE: number; NON_ROUTINE: number; PROJECT: number }
    categoryDetails: Category | null
}) => {
    const [isOpen, setIsOpen] = useState(true)

    if (!categoryDetails) return null

    const renderWeightStatus = (label: string, currentValue: number, limit?: number) => {
        if (limit === undefined || limit === null) return null
        const isOverLimit = currentValue > (limit * 100)
        const formattedValue = currentValue.toFixed(1)
        return (
            <div key={label} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{label}:</span>
                <span className={`font-mono font-medium ${isOverLimit ? 'text-red-500' : 'text-foreground'}`}>
                    {formattedValue}% / {limit * 100}%
                </span>
            </div>
        )
    }

    const isTotalValid = Math.abs(total - 100) < 0.01

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="fixed bottom-4 right-4 w-56 z-50"
        >
            <Card className="shadow-md transition-all duration-300 rounded-xl">
                {/* Compact mode */}
                {!isOpen && (
                    <CardContent className="flex items-center justify-between py-1.5 px-5">
                        <span className="flex justify-between items-center font-bold">Total</span>
                        <div className="flex items-center gap-2">
                            <span
                                className={`flex justify-between items-center font-bold ${isTotalValid ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                {total.toFixed(1)}%
                            </span>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                                    <ChevronUp className="h-3 w-3" />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </CardContent>
                )}

                {/* Expanded mode */}
                <CollapsibleContent>
                    <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
                        <span className="text-sm font-medium">Weight Summary</span>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 pt-0 px-3 pb-3">
                        {renderWeightStatus("Routine", byCategory.ROUTINE, categoryDetails.routine)}
                        {renderWeightStatus("Non-Routine", byCategory.NON_ROUTINE, categoryDetails.non_routine)}
                        {renderWeightStatus("Project", byCategory.PROJECT, categoryDetails.project)}
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center font-bold">
                            <span>Total:</span>
                            <span
                                className={`font-mono ${isTotalValid ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                {total.toFixed(1)}% / 100%
                            </span>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}

// --- COMPONENT START ---
export default function NewIppPage() {
    // --- STATE MANAGEMENT ---
    const [ippData, setIppData] = useState({ ipp: '', year: new Date().getFullYear(), categoryId: '' })
    const [activities, setActivities] = useState<ActivityInput[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const router = useRouter()

    const getToken = () => document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]

    const weightsByCategory = useMemo(() => {
        const totals = {
            ROUTINE: 0,
            NON_ROUTINE: 0,
            PROJECT: 0,
        }
        activities.forEach(act => {
            const weight = Number(act.weight) || 0
            if (totals[act.activity_category] !== undefined) {
                totals[act.activity_category] += weight
            }
        })
        return totals
    }, [activities])

    // --- DATA FETCHING (CATEGORIES ONLY) ---
    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true)
            const token = getToken()
            if (!token) {
                toast.error("Authentication required.")
                router.push('/login')
                return
            }
            try {
                const res = await fetch(`http://localhost:4000/api/category/all`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.status === 404) {
                    setCategories([])
                    setError("Not found")
                    return
                }
                if (!res.ok) throw new Error("Failed to fetch categories")
                const data = await res.json()
                setCategories(data)
                setError(null)
            } catch (error: any) {
                setError("Not found")
                toast.error(error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchCategories()
    }, [router])

    // --- VALIDATION HELPERS ---
    const validateActivities = () => {
        if (activities.length === 0) return "Please add at least one activity."
        if (activities.some(act => !act.activity?.trim())) return "The 'Activity' ID field cannot be empty."
        if (activities.some(act => !act.activity_name?.trim())) return "All activities must have a name."
        if (activities.some(act => !act.kpi?.trim())) return "All activities must have a KPI."
        if (activities.some(act => !act.target?.trim())) return "All activities must have a target."
        if (activities.some(act => !act.deliverable?.trim())) return "All activities must have a deliverable."
        if (activities.some(act => !(act.weight > 0))) return "All activities must have a weight greater than 0."
        return null
    }

    // --- DYNAMIC FORM HANDLERS ---
    const handleIppDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIppData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleCategoryChange = (value: string) => {
        setIppData(prev => ({ ...prev, categoryId: value }))

        const categoryDetails = categories.find(cat => String(cat.category_id) === value) || null
        setSelectedCategory(categoryDetails)
    }

    const addActivityRow = () => {
        setActivities(prev => [...prev, {
            activity: '',
            activity_name: '',
            activity_category: 'ROUTINE',
            kpi: '',
            weight: 0,
            target: '',
            deliverable: '',
        }])
    }

    const handleActivityChange = (index: number, field: keyof ActivityInput, value: string | number) => {
        setActivities(prev => prev.map((act, i) => i === index ? { ...act, [field]: value } : act))
    }

    const removeActivityRow = (index: number) => {
        setActivities(prev => prev.filter((_, i) => i !== index))
    }

    // --- FORM SUBMISSION ---
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const toastId = toast.loading("Creating IPP...")

        try {
            if (!ippData.ipp?.trim() || !ippData.year || !ippData.categoryId) {
                throw new Error("Please fill all IPP header fields (ID, Year, Category).")
            }

            const activityValidationError = validateActivities()
            if (activityValidationError) {
                throw new Error(activityValidationError)
            }

            const storedUser = localStorage.getItem("user")
            if (!storedUser) {
                throw new Error("User information not found. Please log in again.")
            }
            const npk = JSON.parse(storedUser).npk

            const payload = {
                ipp: ippData.ipp.trim(),
                year: Number(ippData.year),
                categoryId: Number(ippData.categoryId),
                npk,
                activities: activities.map(activity => ({
                    ...activity,
                    weight: Number(activity.weight) / 100,
                })),
            }

            const token = getToken()
            const res = await fetch("http://localhost:4000/api/ipp/create", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: "Unknown server error" }))
                throw new Error(errorData.message || `Failed to create IPP (${res.status})`)
            }

            toast.success(`IPP "${payload.ipp}" created successfully!`, { id: toastId })
            router.push('/ipp/entry')
        } catch (error: any) {
            toast.error(error.message, { id: toastId })
        } finally {
            setSubmitting(false)
        }
    }

    const totalWeight = activities.reduce((sum, act) => sum + (Number(act.weight) || 0), 0)


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
                                <BreadcrumbItem>Main Menu</BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>IPP</BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>IPP</BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem><BreadcrumbLink href="/ipp/entry">IPP Entry</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem><BreadcrumbPage>New</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto px-4"><LogoutButton /></div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <form onSubmit={handleSubmit}>
                        <main className="grid flex-1 items-start gap-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.back()}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Back
                                    </Button>
                                    <h1 className="text-xl font-semibold">Create New IPP</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" asChild><Link href="/ipp/entry">Cancel</Link></Button>
                                    <Button type="submit" disabled={submitting || loading}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save IPP
                                    </Button>
                                </div>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">IPP Details</CardTitle>
                                    <CardDescription>Enter the main information for this IPP.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="ipp">IPP ID</Label>
                                            <Input id="ipp" name="ipp" value={ippData.ipp} onChange={handleIppDataChange} placeholder="e.g., IPP-001-2025" required />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="year">Year</Label>
                                            <Input id="year" name="year" type="number" min="1900" max="2100" value={ippData.year} onChange={handleIppDataChange} required />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="categoryId">Category</Label>
                                            <Select name="categoryId" value={ippData.categoryId} onValueChange={handleCategoryChange} required>
                                                <SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger>
                                                <SelectContent>
                                                    {loading ? (
                                                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                                                    ) : error ? (
                                                        <SelectItem value="not-found" disabled>{error}</SelectItem>
                                                    ) : categories.length === 0 ? (
                                                        <SelectItem value="not-found" disabled>Not found</SelectItem>
                                                    ) : (
                                                        categories.map(cat => (
                                                            <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Activities</CardTitle>
                                        <CardDescription>
                                            Total weight must equal 100%.
                                        </CardDescription>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addActivityRow}>
                                        <PlusCircle className="h-4 w-4 mr-2" /> Add Activity
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border overflow-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[150px]">Activity</TableHead>
                                                    <TableHead>Activity Name</TableHead>
                                                    <TableHead>KPI</TableHead>
                                                    <TableHead className="w-[170px]">Category</TableHead>
                                                    <TableHead className="w-[120px]">Weight (%)</TableHead>
                                                    <TableHead>Target</TableHead>
                                                    <TableHead>Deliverable</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activities.length > 0 ? activities.map((activity, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell><Input value={activity.activity} onChange={(e) => handleActivityChange(index, 'activity', e.target.value)} placeholder="e.g., 2.1.1" required /></TableCell>
                                                        <TableCell><Input value={activity.activity_name} onChange={(e) => handleActivityChange(index, 'activity_name', e.target.value)} placeholder="Activity Name" required /></TableCell>
                                                        <TableCell><Input value={activity.kpi} onChange={(e) => handleActivityChange(index, 'kpi', e.target.value)} placeholder="KPI" required /></TableCell>
                                                        <TableCell>
                                                            <Select value={activity.activity_category} onValueChange={(val: any) => handleActivityChange(index, 'activity_category', val)} required>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="ROUTINE">ROUTINE</SelectItem>
                                                                    <SelectItem value="NON_ROUTINE">NON ROUTINE</SelectItem>
                                                                    <SelectItem value="PROJECT">PROJECT</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell><Input type="number" step="0.1" min="0" max="100" value={activity.weight || ''} onChange={(e) => handleActivityChange(index, 'weight', parseFloat(e.target.value) || 0)} placeholder="0.0" required /></TableCell>
                                                        <TableCell><Input value={activity.target} onChange={(e) => handleActivityChange(index, 'target', e.target.value)} placeholder="Target" required /></TableCell>
                                                        <TableCell><Input value={activity.deliverable} onChange={(e) => handleActivityChange(index, 'deliverable', e.target.value)} placeholder="Deliverable" required /></TableCell>
                                                        <TableCell>
                                                            <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => removeActivityRow(index)} title="Remove activity">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                                            No activities added yet. Click "Add Activity" to get started.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </main>
                    </form>
                </div>
                <FloatingWeightSummary
                    total={totalWeight}
                    byCategory={weightsByCategory}
                    categoryDetails={selectedCategory}
                />
            </SidebarInset>
        </SidebarProvider>
    )
}
