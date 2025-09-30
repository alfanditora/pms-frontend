"use client"

import { useEffect, useState } from "react"
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
  CardDescription,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, Search, RefreshCw, PlusCircle, Edit, Trash2, Send } from "lucide-react"
import { toast } from "sonner"

type Ipp = {
  ipp: string
  year: number
  submitAt: string | null
}

export default function Page() {
  const [ipps, setIpps] = useState<Ipp[]>([])
  const [filteredIpps, setFilteredIpps] = useState<Ipp[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIpp, setSelectedIpp] = useState<Ipp | null>(null) // State for submission
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [ippToDelete, setIppToDelete] = useState<Ipp | null>(null)

  const getToken = () => document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]

  const fetchIpps = async () => {
    setLoading(true)
    setSelectedIpp(null) // Reset selection on refresh
    const token = getToken()
    const storedUser = localStorage.getItem("user")

    if (!token || !storedUser) {
      toast.error("Authentication required.")
      setLoading(false)
      return
    }

    const npK = JSON.parse(storedUser).npk

    try {
      const res = await fetch(`https://pms-database.vercel.app/api/ipp/user/${npK}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch IPPs")
      const ippsData = await res.json()
      setIpps(ippsData)
      setFilteredIpps(ippsData)
    } catch (err: any) {
      toast.error(err.message || "Failed to load IPP data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIpps()
  }, [])

  useEffect(() => {
    const filtered = ipps.filter(ipp =>
      ipp.ipp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ipp.year.toString().includes(searchTerm)
    )
    setFilteredIpps(filtered)
  }, [searchTerm, ipps])

  const handleRefresh = () => {
    setSearchTerm("")
    fetchIpps()
    toast.success("Data refreshed successfully")
  }

  const handleOpenDeleteDialog = (ipp: Ipp) => {
    setIppToDelete(ipp)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteIpp = async () => {
    if (!ippToDelete) return
    try {
      const token = getToken()
      const res = await fetch(`https://pms-database.vercel.app/api/ipp/${ippToDelete.ipp}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 204) {
        toast.success(`IPP "${ippToDelete.ipp}" deleted successfully!`)
      } else {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to delete IPP")
      }

      setIsDeleteDialogOpen(false)
      setIppToDelete(null)
      fetchIpps()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // --- NEW FUNCTION FOR SUBMITTING IPP ---
  const handleSubmit = async () => {
    if (!selectedIpp) {
      toast.warning("Please select a draft IPP to submit.")
      return
    }

    const toastId = toast.loading(`Submitting IPP "${selectedIpp.ipp}"...`)
    try {
      const token = getToken()
      const res = await fetch(`https://pms-database.vercel.app/api/ipp/${selectedIpp.ipp}/submit`, {
        method: "PATCH", // Using PATCH as per REST conventions for updates
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to submit IPP")
      }

      toast.success(`IPP "${selectedIpp.ipp}" submitted successfully!`, { id: toastId })
      setSelectedIpp(null) // Reset selection
      fetchIpps() // Refresh the list to show the new status
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    }
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
                <BreadcrumbItem>Main Menu</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>IPP</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>IPP Entry</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4"><LogoutButton /></div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">IPP Entry</CardTitle>
              <CardDescription>Create, edit, and submit your IPP records. Once submitted, an IPP cannot be edited.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search IPP or year..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/ipp/entry/new">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add New IPP
                    </Link>
                  </Button>
                  {/* --- SUBMIT BUTTON --- */}
                  <Button size="sm" onClick={handleSubmit} disabled={!selectedIpp || !!selectedIpp.submitAt}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Selected
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <RadioGroup
                    key={ipps.map(i => i.ipp).join(",")}
                    onValueChange={(value) => setSelectedIpp(ipps.find(ipp => ipp.ipp === value) || null)}
                  >
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                        <TableHead className="w-[80px] text-center">Select</TableHead>
                        <TableHead className="text-center">IPP ID</TableHead>
                        <TableHead className="text-center">Year</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center w-[150px]">Actions</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredIpps.length > 0 ? (
                          filteredIpps.map((ipp) => (
                            <TableRow key={ipp.ipp} className={selectedIpp?.ipp === ipp.ipp ? "bg-muted" : ""}>
                              {/* --- RADIO BUTTON COLUMN --- */}
                              <TableCell className="text-center">
                                <RadioGroupItem value={ipp.ipp} id={ipp.ipp} disabled={!!ipp.submitAt} />
                              </TableCell>
                              <TableCell className="flex justify-center items-center">
                                <Label htmlFor={ipp.ipp} className="font-mono cursor-pointer">
                                  <Badge variant="outline">
                                    {ipp.ipp}
                                  </Badge>
                                </Label>
                              </TableCell>
                              <TableCell className="text-center font-medium">{ipp.year}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={ipp.submitAt ? "secondary" : "outline"}>
                                  {ipp.submitAt ? "Submitted" : "Draft"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={!!ipp.submitAt}
                                  onClick={() => {
                                    if (!ipp.submitAt) {
                                      window.location.href = `/ipp/entry/${ipp.ipp}`
                                    }
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleOpenDeleteDialog(ipp)} disabled={!!ipp.submitAt}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground">No IPP data found.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the IPP
              <span className="font-bold"> "{ippToDelete?.ipp}" </span>
              and all its associated activities.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteIpp}>
              Yes, delete it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}