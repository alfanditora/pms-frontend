"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
    id?: number
    clientId: number
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

// --- FLOATING SUMMARY COMPONENT ---
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
        return (
            <div key={label} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{label}:</span>
                <span className={`font-mono font-medium ${isOverLimit ? 'text-red-500' : 'text-foreground'}`}>
                    {currentValue.toFixed(1)}% / {limit * 100}%
                </span>
            </div>
        )
    }

    const isTotalValid = Math.abs(total - 100) < 0.01

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="fixed bottom-4 right-4 w-56 z-50">
            <Card className="shadow-lg rounded-xl">
                {!isOpen && (
                    <CardContent className="flex items-center justify-between p-2 px-3">
                        <span className="font-bold text-sm">Total</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${isTotalValid ? "text-green-600" : "text-red-600"}`}>
                                {total.toFixed(1)}%
                            </span>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0"><ChevronUp className="h-4 w-4" /></Button>
                            </CollapsibleTrigger>
                        </div>
                    </CardContent>
                )}
                <CollapsibleContent>
                    <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
                        <span className="text-sm font-medium">Weight Summary</span>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0"><ChevronDown className="h-4 w-4" /></Button>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 pt-0 px-3 pb-3">
                        {renderWeightStatus("Routine", byCategory.ROUTINE, categoryDetails.routine)}
                        {renderWeightStatus("Non-Routine", byCategory.NON_ROUTINE, categoryDetails.non_routine)}
                        {renderWeightStatus("Project", byCategory.PROJECT, categoryDetails.project)}
                        <Separator className="my-1" />
                        <div className="flex justify-between items-center font-bold">
                            <span>Total:</span>
                            <span className={`font-mono ${isTotalValid ? "text-green-600" : "text-red-600"}`}>
                                {total.toFixed(1)}% / 100%
                            </span>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}


// --- MAIN PAGE COMPONENT ---
export default function EditIppWithActivitiesPage() {
    const { ippId } = useParams<{ ippId: string }>()
    const router = useRouter()

    const [ippData, setIppData] = useState({ year: new Date().getFullYear(), categoryId: '' })
    const [activities, setActivities] = useState<ActivityInput[]>([])
    const [initialActivities, setInitialActivities] = useState<ActivityInput[]>([])
    const [deletedActivityIds, setDeletedActivityIds] = useState<number[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null) // State for summary
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const getToken = () => document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]

    // --- CALCULATIONS ---
    const weightsByCategory = useMemo(() => {
        const totals = { ROUTINE: 0, NON_ROUTINE: 0, PROJECT: 0 }
        activities.forEach(act => {
            const weight = Number(act.weight) || 0
            if (totals[act.activity_category] !== undefined) {
                totals[act.activity_category] += weight
            }
        })
        return totals
    }, [activities])

    const totalWeight = useMemo(() => Object.values(weightsByCategory).reduce((sum, current) => sum + current, 0), [weightsByCategory]);


    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const token = getToken()
            if (!token) {
                toast.error("Authentication required.")
                router.push("/login")
                return
            }
            try {
                const [ippRes, actsRes, catsRes] = await Promise.all([
                    fetch(`http://localhost:4000/api/ipp/${ippId}`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`http://localhost:4000/api/ipp/${ippId}/activities`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`http://localhost:4000/api/category/all`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (!ippRes.ok || !actsRes.ok || !catsRes.ok) throw new Error("Failed to load initial data.");

                const ippDetails = await ippRes.json();
                const activitiesDetails = await actsRes.json();
                const categoriesData = await catsRes.json();

                setIppData({
                    year: ippDetails.year,
                    categoryId: String(ippDetails.categoryId)
                });

                const formattedActivities = activitiesDetails.map((act: any) => ({
                    ...act,
                    clientId: act.id,
                    weight: parseFloat(act.weight) * 100
                }));
                setActivities(formattedActivities);
                setInitialActivities(JSON.parse(JSON.stringify(formattedActivities)));
                setCategories(categoriesData);

                // Set the selected category details for the summary component
                const currentCategory = categoriesData.find((cat: Category) => cat.category_id === ippDetails.categoryId) || null;
                setSelectedCategory(currentCategory);

            } catch (error: any) {
                toast.error(error.message || "Could not fetch IPP details.");
                router.push('/ipp/entry');
            } finally {
                setLoading(false);
            }
        };

        if (ippId) fetchData();
    }, [ippId, router]);

    // --- FORM HANDLERS ---
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
            clientId: Date.now(),
            activity: '', activity_name: '', activity_category: 'ROUTINE',
            kpi: '', weight: 0, target: '', deliverable: ''
        }])
    }

    const handleActivityChange = (clientId: number, field: keyof ActivityInput, value: any) => {
        setActivities(prev => prev.map(act => act.clientId === clientId ? { ...act, [field]: value } : act))
    }

    const removeActivityRow = (activityToRemove: ActivityInput) => {
        if (activityToRemove.id) {
            setDeletedActivityIds(prev => [...prev, activityToRemove.id!])
        }
        setActivities(prev => prev.filter(act => act.clientId !== activityToRemove.clientId))
    }

    // --- FORM SUBMISSION ---
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const token = getToken();
        const toastId = toast.loading("Saving changes...");

        // Client-side validation
        if (activities.some(act => !act.activity || act.activity.trim() === '')) {
            toast.error("The 'Activity' ID field cannot be empty.", { id: toastId });
            setSubmitting(false);
            return;
        }

        try {
            // Your existing logic for handling updates, deletions, and creations...
            // This part remains the same.

            await Promise.all([
                // 1. Update IPP Header
                fetch(`http://localhost:4000/api/ipp/${ippId}/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        year: Number(ippData.year),
                        categoryId: Number(ippData.categoryId)
                    })
                }),

                // 2. Handle Deletions
                ...deletedActivityIds.map(id => {
                    const initialActivity = initialActivities.find(act => act.id === id);
                    if (initialActivity) {
                        return fetch(`http://localhost:4000/api/ipp/${ippId}/activities/${initialActivity.activity}/delete`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    }
                    return Promise.resolve();
                }),

                // 3. Handle Updates and Creations
                ...activities.map(currentActivity => {
                    const { clientId, ...payload } = { ...currentActivity, weight: currentActivity.weight / 100 };
                    const initialActivity = initialActivities.find(act => act.id === currentActivity.id);

                    if (currentActivity.id) { // Update existing
                        if (JSON.stringify(currentActivity) !== JSON.stringify(initialActivity)) {
                            return fetch(`http://localhost:4000/api/ipp/${ippId}/activities/${initialActivity?.activity}/update`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify(payload)
                            });
                        }
                    } else { // Create new
                        return fetch(`http://localhost:4000/api/ipp/${ippId}/activities/add`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify(payload)
                        });
                    }
                    return Promise.resolve();
                })
            ].filter(Boolean)); // Filter out any null promises

            toast.success("IPP updated successfully!", { id: toastId });
            router.push('/ipp/entry');
        } catch (error: any) {
            toast.error(error.message || "An error occurred while saving.", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>Main Menu</BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>IPP</BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem><BreadcrumbLink href="/ipp/entry">IPP Entry</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem><BreadcrumbPage>Edit ({ippId})</BreadcrumbPage></BreadcrumbItem>
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
                                    <h1 className="text-xl font-semibold">Edit IPP & Activities</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" asChild><Link href="/ipp/entry">Cancel</Link></Button>
                                    <Button type="submit" disabled={submitting || loading}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">{ippId}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="ipp">IPP ID</Label>
                                            <Input id="ipp" name="ipp" value={ippId} disabled />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="year">Year</Label>
                                            <Input id="year" name="year" type="number" value={ippData.year} onChange={handleIppDataChange} required />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="categoryId">Category</Label>
                                            <Select name="categoryId" value={ippData.categoryId} onValueChange={handleCategoryChange} required>
                                                <SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.category_id} value={String(cat.category_id)}>{cat.name}</SelectItem>
                                                    ))}
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
                                        <CardDescription>Edit, add, or remove activities for this IPP.</CardDescription>
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
                                                {activities.length > 0 ? activities.map((activity) => (
                                                    <TableRow key={activity.clientId}>
                                                        <TableCell><Input value={activity.activity} onChange={(e) => handleActivityChange(activity.clientId, 'activity', e.target.value)} required /></TableCell>
                                                        <TableCell><Input value={activity.activity_name} onChange={(e) => handleActivityChange(activity.clientId, 'activity_name', e.target.value)} required /></TableCell>
                                                        <TableCell><Input value={activity.kpi} onChange={(e) => handleActivityChange(activity.clientId, 'kpi', e.target.value)} required /></TableCell>
                                                        <TableCell>
                                                            <Select value={activity.activity_category} onValueChange={(val: any) => handleActivityChange(activity.clientId, 'activity_category', val)} required>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="ROUTINE">ROUTINE</SelectItem>
                                                                    <SelectItem value="NON_ROUTINE">NON ROUTINE</SelectItem>
                                                                    <SelectItem value="PROJECT">PROJECT</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell><Input type="number" step="0.1" value={activity.weight} onChange={(e) => handleActivityChange(activity.clientId, 'weight', parseFloat(e.target.value) || 0)} required /></TableCell>
                                                        <TableCell><Input value={activity.target} onChange={(e) => handleActivityChange(activity.clientId, 'target', e.target.value)} required /></TableCell>
                                                        <TableCell><Input value={activity.deliverable} onChange={(e) => handleActivityChange(activity.clientId, 'deliverable', e.target.value)} required /></TableCell>
                                                        <TableCell>
                                                            <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removeActivityRow(activity)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No activities found.</TableCell>
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

                {/* --- FLOATING SUMMARY COMPONENT INSTANCE --- */}
                <FloatingWeightSummary
                    total={totalWeight}
                    byCategory={weightsByCategory}
                    categoryDetails={selectedCategory}
                />
            </SidebarInset>
        </SidebarProvider>
    )
}