"use client"

import { useEffect, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Loader2, 
  Search, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  Filter
} from "lucide-react"
import { toast } from "sonner"

type Ipp = {
  ipp: string
  year: number
  submitAt: string | null
  verify: "PENDING" | "VERIFIED" | "REJECTED"
  approval: "PENDING" | "APPROVED" | "REJECTED"
  npk?: string
  categoryId?: number
  user?: {
    name: string
    department: {
      name: string
    }
  }
}

type FilterStatus = "all" | "pending" | "verified" | "approved" | "rejected"

export default function UserPage() {
  const [ipps, setIpps] = useState<Ipp[]>([])
  const [filteredIpps, setFilteredIpps] = useState<Ipp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const router = useRouter()

  const getToken = () => {
    const cookies = document.cookie.split(";")
    const tokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("token=")
    )
    return tokenCookie ? tokenCookie.split("=")[1] : null
  }

  const fetchIpps = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = getToken()

      if (!token) {
  setError("Token not found. Please login again.")
  toast.error("Session expired. Please login again.")
  router.push("/login")
        return
      }

      // Get user data from localStorage
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem("user") : null
      
      if (!storedUser) {
        setError("User data not found. Please login again.")
        toast.error("User data not found. Please login again.")
        router.push("/login")
        return
      }

      const parsedUser = JSON.parse(storedUser)
      const npk = parsedUser.npk

      if (!npk) {
        setError("NPK not found in user data.")
        return
      }

      // Fetch active IPPs for the user
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pms-database.vercel.app'}/api/ipp/user/${npk}/active`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (res.status === 401) {
        setError("Session expired. Please login again.")
        toast.error("Session expired. Please login again.")
        router.push("/login")
        return
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || `HTTP ${res.status}: Failed to fetch IPPs`)
      }

      const data = await res.json()
      
      // Handle different response formats
      let ippData: Ipp[] = []
      if (Array.isArray(data)) {
        ippData = data
      } else if (data && typeof data === 'object') {
        // If single IPP object is returned, wrap in array
        ippData = [data]
      }
      
      setIpps(ippData)
      
      // Show success message only if we have data
      if (ippData.length > 0) {
        toast.success("IPP data loaded successfully")
      }
    } catch (err) {
      console.error("Error fetching IPPs:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load IPP data"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Enhanced filtering logic
  useEffect(() => {
    let filtered = ipps

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(ipp =>
        ipp.ipp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipp.year.toString().includes(searchTerm) ||
        (ipp.user?.name && ipp.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(ipp => {
        switch (filterStatus) {
          case "pending":
            return ipp.verify === "PENDING" || ipp.approval === "PENDING"
          case "verified":
            return ipp.verify === "VERIFIED"
          case "approved":
            return ipp.approval === "APPROVED"
          case "rejected":
            return ipp.verify === "REJECTED" || ipp.approval === "REJECTED"
          default:
            return true
        }
      })
    }

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(ipp => ipp.year.toString() === yearFilter)
    }

    setFilteredIpps(filtered)
  }, [searchTerm, ipps, filterStatus, yearFilter])

  // Refresh handler
  const handleRefresh = () => {
    fetchIpps()
  }

  // Initial data fetch
  useEffect(() => {
    fetchIpps()
  }, [])

  // Get unique years for filter
  const availableYears = [...new Set(ipps.map(ipp => ipp.year))].sort((a, b) => b - a)

  const getStatusBadge = (status: string, type: "verify" | "approval" = "verify") => {
    const baseClasses = "flex items-center gap-1 font-medium"
    
    switch (status) {
      case "VERIFIED":
      case "APPROVED":
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-100 border-green-200`}>
            <CheckCircle className="h-3 w-3" />
            {status}
          </Badge>
        )
      case "PENDING":
        return (
          <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200`}>
            <Clock className="h-3 w-3" />
            {status}
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800 hover:bg-red-100 border-red-200`}>
            <XCircle className="h-3 w-3" />
            {status}
          </Badge>
        )
      default:
        return (
          <Badge className={`${baseClasses} bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200`}>
            <AlertTriangle className="h-3 w-3" />
            {status}
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not submitted"
    
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
  return "Invalid date format"
    }
  }

  const getOverallStatus = (ipp: Ipp) => {
    if (!ipp.submitAt) return "Draft"
    if (ipp.approval === "APPROVED") return "Approved"
    if (ipp.approval === "REJECTED" || ipp.verify === "REJECTED") return "Rejected"
    if (ipp.verify === "VERIFIED" && ipp.approval === "PENDING") return "Awaiting Approval"
    if (ipp.verify === "PENDING") return "Awaiting Verification"
    return "In Review"
  }

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
                  <BreadcrumbLink href="/ipp">IPP</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>IPP Monitoring</BreadcrumbPage>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-2xl font-bold">IPP Monitoring</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor the status and progress of your Individual Performance Plan
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
                    placeholder="Search IPP, year, or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                {availableYears.length > 0 && (
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-full sm:w-[120px]">
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
              </div>

              {/* Results Info */}
              {!loading && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredIpps.length} of {ipps.length} IPP
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Loading IPP data...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="text-center py-16">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">An Error Occurred</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}

              {/* Data Table */}
              {!loading && !error && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[150px] font-semibold">IPP ID</TableHead>
                        <TableHead className="text-center font-semibold">Year</TableHead>
                        <TableHead className="text-center font-semibold">Status</TableHead>
                        <TableHead className="text-center font-semibold">Submit Date</TableHead>
                        <TableHead className="text-center font-semibold">Verification</TableHead>
                        <TableHead className="text-center font-semibold">Approval</TableHead>
                        <TableHead className="text-center font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIpps.length > 0 ? (
                        filteredIpps.map((ipp, index) => (
                          <TableRow
                            key={ipp.ipp}
                            className={`hover:bg-muted/50 transition-colors ${
                              index % 2 === 0 ? "bg-background" : "bg-muted/20"
                            }`}
                          >
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {ipp.ipp}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {ipp.year}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="text-xs">
                                {getOverallStatus(ipp)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {ipp.submitAt ? (
                                <div className="text-sm">
                                  {formatDate(ipp.submitAt)}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-sm">
                                  Not submitted
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(ipp.verify)}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(ipp.approval, "approval")}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                              >
                                <Link href={`/ipp/monitoring/${ipp.ipp}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Detail
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-16">
                            <div className="flex flex-col items-center">
                              <div className="rounded-full bg-muted p-3 mb-4">
                                <Search className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="font-semibold text-lg mb-2">
                                {searchTerm || filterStatus !== "all" || yearFilter !== "all" 
                                  ? "No matching IPP found" 
                                  : "No IPP yet"
                                }
                              </h3>
                              <p className="text-muted-foreground text-sm text-center max-w-md">
                                {searchTerm || filterStatus !== "all" || yearFilter !== "all"
                                  ? "Try changing your filter or search keyword"
                                  : "You do not have any active IPP yet. Please create a new IPP or contact the administrator."
                                }
                              </p>
                              {(searchTerm || filterStatus !== "all" || yearFilter !== "all") && (
                                <Button 
                                  variant="outline" 
                                  className="mt-4"
                                  onClick={() => {
                                    setSearchTerm("")
                                    setFilterStatus("all")
                                    setYearFilter("all")
                                  }}
                                >
                                  Reset Filter
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}