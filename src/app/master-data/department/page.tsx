"use client"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Search, Loader2, Building2, RefreshCw } from "lucide-react"

type Department = {
  department_id: number
  name: string
}

export default function Page() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    localStorage.removeItem("user")
    router.push("/login")
    toast.success("Successfully logged out")
  }

  // Get token helper
  const getToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1]
  }

  // Fetch department data
  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const token = getToken()

      const res = await fetch("http://localhost:4000/api/department/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to fetch department data")
      const data = await res.json()
      const sortedData = data.sort((a: Department, b: Department) => a.department_id - b.department_id)
      setDepartments(sortedData)
      setFilteredDepartments(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load department data")
    } finally {
      setLoading(false)
    }
  }

  // Filter departments based on search
  useEffect(() => {
    const filtered = departments.filter(dept =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.department_id.toString().includes(searchTerm)
    )
    setFilteredDepartments(filtered)
  }, [searchTerm, departments])

  // Refresh data
  const handleRefresh = () => {
    fetchDepartments()
    toast.success("Data refreshed successfully")
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink>Main Menu</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink>Master Data</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Department</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4">
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-white min-h-[100vh] flex-1 rounded-xl md:min-h-min">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-2xl">Department List</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Information about all departments in the company
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRefresh}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    {/* Search and Stats */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search department or ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="px-3 py-1 font-medium">
                          <Building2 className="h-3 w-3 mr-1" />
                          {filteredDepartments.length} Department(s)
                        </Badge>
                        {searchTerm && (
                          <Badge variant="outline" className="px-3 py-1">
                            Search results for: "{searchTerm}"
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                          <p className="text-muted-foreground">Loading department data...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-[120px] font-semibold px-4 text-center">ID</TableHead>
                              <TableHead className="font-semibold">Department Name</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDepartments.length > 0 ? (
                              filteredDepartments.map((dept, index) => (
                                <TableRow 
                                  key={dept.department_id} 
                                  className={`hover:bg-muted/30 transition-colors ${
                                    index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                                  }`}
                                >
                                  <TableCell className="text-center font-mono">
                                    {dept.department_id}
                                  </TableCell>
                                  <TableCell className="font-medium py-4">
                                    <div className="flex items-center gap-2">
                                      {dept.name}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center py-16">
                                  <div className="flex flex-col items-center gap-4">
                                    {searchTerm ? (
                                      <>
                                        <Search className="h-12 w-12 text-muted-foreground/50" />
                                        <div className="text-center">
                                          <p className="text-lg font-medium text-muted-foreground">
                                            No results found
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Try using a different keyword or clear the filter
                                          </p>
                                        </div>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setSearchTerm("")}
                                        >
                                          Clear Filter
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Building2 className="h-12 w-12 text-muted-foreground/50" />
                                        <div className="text-center">
                                          <p className="text-lg font-medium text-muted-foreground">
                                            No department data yet
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Department data will appear here
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Footer Info */}
                    {!loading && filteredDepartments.length > 0 && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                        <p>
                          Showing {filteredDepartments.length} of {departments.length} department(s)
                        </p>
                        <p>
                          Last updated: {new Date().toLocaleString('en-US')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
