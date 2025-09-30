"use client"

import { LogoutButton } from "@/components/navbar/logout"
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
import { Search, Loader2, Layers, RefreshCw } from "lucide-react"

type Category = {
  category_id: number
  name: string
  routine: number
  non_routine: number
  project: number
}

export default function Page() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Get token helper
  const getToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1]
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = getToken()

      const res = await fetch("https://pms-database.vercel.app/api/category/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to fetch categories")
      const data = await res.json()
      const sortedData = data.sort((a: Category, b: Category) => a.category_id - b.category_id)
      setCategories(sortedData)
      setFilteredCategories(sortedData)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  // Filter categories
  useEffect(() => {
    const filtered = categories.filter(cat =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.category_id.toString().includes(searchTerm)
    )
    setFilteredCategories(filtered)
  }, [searchTerm, categories])

  // Refresh
  const handleRefresh = () => {
    fetchCategories()
    toast.success("Data refreshed successfully")
  }

  useEffect(() => {
    fetchCategories()
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
                  <BreadcrumbPage>Category</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4">
            <LogoutButton />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-white min-h-[100vh] flex-1 rounded-xl md:min-h-min">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">Category List</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Information about all categories
                    </p>
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
                        placeholder="Search category or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="px-3 py-1 font-medium">
                        <Layers className="h-3 w-3 mr-1" />
                        {filteredCategories.length} Category(ies)
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
                        <p className="text-muted-foreground">Loading categories...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[120px] text-center font-semibold">ID</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="text-center font-semibold">Routine %</TableHead>
                            <TableHead className="text-center font-semibold">Non-Routine %</TableHead>
                            <TableHead className="text-center font-semibold">Project %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((cat, index) => (
                              <TableRow
                                key={cat.category_id}
                                className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                                  }`}
                              >
                                <TableCell className="text-center font-mono">{cat.category_id}</TableCell>
                                <TableCell className="font-medium">{cat.name}</TableCell>
                                <TableCell className="text-center">{cat.routine*100}%</TableCell>
                                <TableCell className="text-center">{cat.non_routine*100}%</TableCell>
                                <TableCell className="text-center">{cat.project*100}%</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-16">
                                <div className="flex flex-col items-center gap-4">
                                  {searchTerm ? (
                                    <>
                                      <Search className="h-12 w-12 text-muted-foreground/50" />
                                      <p className="text-lg font-medium text-muted-foreground">
                                        No results found
                                      </p>
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
                                      <Layers className="h-12 w-12 text-muted-foreground/50" />
                                      <p className="text-lg font-medium text-muted-foreground">
                                        No category data yet
                                      </p>
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
                  {!loading && filteredCategories.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                      <p>
                        Showing {filteredCategories.length} of {categories.length} category(ies)
                      </p>
                      <p>
                        Last updated: {new Date().toLocaleString("en-US")}
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
