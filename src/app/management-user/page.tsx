"use client"

import { useEffect, useState } from "react"
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, Settings, Shield, Building } from "lucide-react"

import { AppSidebar } from "@/components/sidebar/app-sidebar"

type User = {
  npk: string
  name: string
  section: string
  position: string
  grade: number
  departmentId: number
  privillege: "ADMIN" | "USER" | "OPERATION"
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [departments, setDepartments] = useState<{ department_id: number, name: string }[]>([])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const router = useRouter()

  const getToken = () => {
    const cookies = document.cookie.split(';')
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='))
    return tokenCookie ? tokenCookie.split('=')[1] : null
  }

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = getToken();
        const res = await fetch("http://localhost:4000/api/department/all", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to fetch department: ${res.status}`);
        }

        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        console.error("Error fetch department:", err);
        toast.error("Failed to get list department");
      }
    }

    fetchDepartments()
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      setFetchLoading(true);
      try {
        const token = getToken();
        if (!token) {
          toast.error("Sesi autentikasi telah berakhir. Silakan login kembali.");
          router.push("/login");
          return;
        }

        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          toast.error("Data pengguna tidak ditemukan. Silakan login kembali.");
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          router.push("/login");
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?.npk) {
          toast.error("Data pengguna tidak valid. Silakan login kembali.");
          router.push("/login");
          return;
        }

        const res = await fetch(`http://localhost:4000/api/user/${parsedUser.npk}/profile`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            localStorage.removeItem('user');
            router.push("/login");
          } else {
            throw new Error(`Gagal mengambil profil: ${res.statusText}`);
          }
          return;
        }

        const data = await res.json();
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));

      } catch (error) {
        console.error("Gagal mengambil profil pengguna:", error);
        toast.error("Terjadi kesalahan saat mengambil profil Anda.");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!user) return
    setLoading(true)

    try {
      const token = getToken()
      if (!token) {
        toast.error("Token tidak ditemukan. Silakan login kembali.")
        router.push("/login")
        return
      }

      const updateData = {
        name: user.name,
        section: user.section,
        position: user.position,
        grade: user.grade,
        departmentId: user.departmentId,
      }

      const res = await fetch(`http://localhost:4000/api/user/${user.npk}/update`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Sesi berakhir. Silakan login kembali.")
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          localStorage.removeItem('user')
          router.push("/login")
          return
        }

        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Gagal memperbarui profil")
      }

      const updatedUser = await res.json()
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      toast.success("Profil berhasil diperbarui")
    } catch (error: any) {
      console.error("Gagal memperbarui profil:", error)
      toast.error(error.message || "Gagal memperbarui profil")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return

    if (!password || !confirmPassword) {
      toast.error("Password tidak boleh kosong")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok")
      return
    }

    if (password.length < 6) {
      toast.error("Password minimal harus 6 karakter")
      return
    }

    setLoading(true)

    try {
      const token = getToken()
      if (!token) {
        toast.error("Token tidak ditemukan. Silakan login kembali.")
        router.push("/login")
        return
      }

      const res = await fetch(`http://localhost:4000/api/user/${user.npk}/update`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Sesi berakhir. Silakan login kembali.")
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          localStorage.removeItem('user')
          router.push("/login")
          return
        }

        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Gagal mengubah password")
      }

      toast.success("Password berhasil diubah")
      setPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Gagal mengubah password:", error)
      toast.error(error.message || "Gagal mengubah password")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.removeItem('user')
    router.push('/login')
    toast.success("Berhasil keluar")
  }

  const getPrivilegeColor = (privilege: string) => {
    switch (privilege) {
      case "ADMIN":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "OPERATION":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "USER":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getDepartmentName = (departmentId: number) => {
    const dept = departments.find(d => d.department_id === departmentId)
    return dept ? dept.name : "Unknown Department"
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Memuat profil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Data pengguna tidak ditemukan</p>
          <Button onClick={() => router.push("/login")} className="mt-2">
            Kembali ke Login
          </Button>
        </div>
      </div>
    )
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink>
                    Main Menu
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Management User</BreadcrumbPage>
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
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
            <div className="p-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <CardTitle>Profile Management</CardTitle>
                  </div>
                  <CardDescription>
                    Kelola informasi profil dan kredensial akun Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="profile" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        User Information
                      </TabsTrigger>
                      <TabsTrigger value="credentials" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Credentials & Password
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile" className="space-y-4 mt-6">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="npk">NPK</Label>
                            <Input 
                              id="npk"
                              value={user.npk} 
                              disabled 
                              className="bg-muted font-mono" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="privilege">Privilege</Label>
                            <div className="flex items-center h-10">
                              <Badge className={getPrivilegeColor(user.privillege)}>
                                {user.privillege}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={user.name}
                            onChange={(e) => setUser({ ...user, name: e.target.value })}
                            placeholder="Enter full name"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="section">Section</Label>
                            <Input
                              id="section"
                              value={user.section}
                              onChange={(e) => setUser({ ...user, section: e.target.value })}
                              placeholder="Enter section"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="position">Position</Label>
                            <Input
                              id="position"
                              value={user.position}
                              onChange={(e) => setUser({ ...user, position: e.target.value })}
                              placeholder="Enter position"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Input
                              id="grade"
                              type="number"
                              value={user.grade}
                              onChange={(e) => setUser({ ...user, grade: Number(e.target.value) })}
                              placeholder="Enter grade"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Select
                              value={user.departmentId?.toString()}
                              onValueChange={(value) =>
                                setUser({ ...user, departmentId: Number(value) })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem 
                                    key={dept.department_id} 
                                    value={dept.department_id.toString()}
                                  >
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="pt-4">
                          <Button 
                            onClick={handleSaveProfile} 
                            disabled={loading}
                            className="w-full md:w-auto"
                          >
                            {loading ? "Menyimpan..." : "Simpan Profil"}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="credentials" className="space-y-4 mt-6">
                      <div className="grid gap-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-amber-800">
                            <Settings className="h-4 w-4" />
                            <h4 className="font-medium">Change Password</h4>
                          </div>
                          <p className="text-sm text-amber-700 mt-1">
                            Pastikan password Anda kuat dan tidak mudah ditebak. Minimal 6 karakter.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              placeholder="Enter new password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                          </div>

                          <div className="pt-4">
                            <Button 
                              onClick={handleChangePassword} 
                              disabled={loading || !password || !confirmPassword}
                              className="w-full md:w-auto"
                            >
                              {loading ? "Mengubah..." : "Ubah Password"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}