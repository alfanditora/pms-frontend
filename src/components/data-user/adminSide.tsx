"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/navbar/logout"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Search, RefreshCw, PlusCircle, Edit, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

// --- TYPE DEFINITIONS ---
type UserType = {
  npk: string
  name: string
  section: string
  position: string
  grade: number
  departmentId: number
  privillege: "ADMIN" | "USER" | "OPERATION"
  department?: {
    name: string
  }
}

type Department = {
  department_id: number
  name: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserType[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null)

  const getToken = () => document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true)
    const token = getToken()
    try {
      const [usersRes, deptsRes] = await Promise.all([
        fetch("http://localhost:4000/api/user/all", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/department/all", { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (!usersRes.ok) throw new Error("Failed to fetch users")
      if (!deptsRes.ok) throw new Error("Failed to fetch departments")

      const usersData = await usersRes.json()
      const deptsData = await deptsRes.json()

      setUsers(usersData)
      setFilteredUsers(usersData)
      setDepartments(deptsData)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- FILTERING & REFRESH ---
  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.npk.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleRefresh = () => {
    fetchData()
    toast.success("Data refreshed successfully")
  }

  // --- DIALOG HANDLERS ---
  const handleOpenDialog = (user: UserType | null = null) => {
    setCurrentUser(user)
    setIsDialogOpen(true)
  }

  const handleOpenDeleteDialog = (user: UserType) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  // --- CRUD OPERATIONS ---
  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const isEditing = currentUser !== null

    const data = {
      npk: formData.get("npk") as string,
      name: formData.get("name") as string,
      password: formData.get("password") as string,
      section: formData.get("section") as string,
      position: formData.get("position") as string,
      grade: Number(formData.get("grade")),
      departmentId: Number(formData.get("departmentId")),
      privillege: formData.get("privillege") as UserType['privillege'],
    }

    // Jangan kirim password jika tidak diisi saat mengedit
    if (isEditing && !data.password) {
      delete (data as any).password
    }

    const token = getToken()
    const url = isEditing ? `http://localhost:4000/api/user/${currentUser?.npk}/update` : "http://localhost:4000/api/user/create"
    const method = isEditing ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} user`)
      }

      toast.success(`User ${isEditing ? 'updated' : 'created'} successfully!`)
      setIsDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    try {
      const token = getToken()
      const res = await fetch(`http://localhost:4000/api/user/${userToDelete.npk}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to delete user")
      }

      toast.success(`User "${userToDelete.name}" deleted successfully!`)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
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
                <BreadcrumbItem>Master Data</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Users</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4"><LogoutButton /></div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">User List</CardTitle>
              <CardDescription>View, create, update, and delete user accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by NPK or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                  <Button size="sm" onClick={() => handleOpenDialog()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">NPK</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Position</TableHead>
                      <TableHead className="font-semibold">Department</TableHead>
                      <TableHead className="text-center font-semibold">Role</TableHead>
                      <TableHead className="text-center font-semibold w-[120px]">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.npk}>
                            <TableCell><Badge variant="outline" className="font-mono">{user.npk}</Badge></TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.position}</TableCell>
                            <TableCell>{departments.find(d => d.department_id === user.departmentId)?.name || 'N/A'}</TableCell>
                            <TableCell className="text-center"><Badge variant={user.privillege === 'ADMIN' ? 'default' : 'secondary'}>{user.privillege}</Badge></TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleOpenDeleteDialog(user)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={6} className="text-center py-16 text-muted-foreground">No users found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      {/* --- DIALOGS --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentUser ? 'Edit User' : 'Create New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="npk" className="text-left">NPK</Label>
                <Input id="npk" name="npk" defaultValue={currentUser?.npk} className="col-span-3" required disabled={!!currentUser} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-left">Name</Label>
                <Input id="name" name="name" defaultValue={currentUser?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-left">Password</Label>
                <Input id="password" name="password" type="password" className="col-span-3" placeholder={currentUser ? "Enter password" : ""} required={!currentUser} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-left">Confirm Password</Label>
                <Input id="password" name="password" type="password" className="col-span-3" placeholder={currentUser ? "Confirm password" : ""} required={!currentUser} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position" className="text-left">Position</Label>
                <Input id="position" name="position" defaultValue={currentUser?.position} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="section" className="text-left">Section</Label>
                <Input id="section" name="section" defaultValue={currentUser?.section} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade" className="text-left">Grade</Label>
                <Input id="grade" name="grade" type="number" defaultValue={currentUser?.grade} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="departmentId" className="text-left">Department</Label>
                <Select name="departmentId" defaultValue={String(currentUser?.departmentId)} required>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select department..." /></SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.department_id} value={String(dept.department_id)}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="privillege" className="text-left">Role</Label>
                <Select name="privillege" defaultValue={currentUser?.privillege} required>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select role..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="OPERATION">OPERATION</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the user <span className="font-bold">"{userToDelete?.name}"</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteUser}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}