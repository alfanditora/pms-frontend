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
import { User, Settings, Shield, Building, Loader2 } from "lucide-react"

import { AppSidebar } from "@/components/sidebar/app-sidebar"

type UserType = {
  npk: string
  name: string
  section: string
  position: string
  grade: number
  departmentId: number
  privillege: "ADMIN" | "USER" | "OPERATION"
}

type Department = {
  department_id: number
  name: string
}

export default function Page() {
  const [user, setUser] = useState<UserType | null>(null)
  const [departments, setDepartments] = useState<{ department_id: number, name: string }[]>([])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const router = useRouter()

  const getToken = () => {
    const cookies = document.cookie.split(';')
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='))
    return tokenCookie ? tokenCookie.split('=')[1] : null
  }

  // Fetch departments
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
          throw new Error(`Failed to fetch departments: ${res.status}`);
        }
        
        const data = await res.json();
        const sortedData = data.sort((a: Department, b: Department) => a.department_id - b.department_id)
        setDepartments(sortedData);
      } catch (err) {
        console.error("Error fetching departments:", err);
        toast.error("Failed to fetch departments");
      }
    }

    fetchDepartments()
  }, [])

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const token = getToken();
        if (!token) {
          toast.error("Your session has expired. Please log in again.");
          router.push("/login");
          return;
        }

        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          toast.error("User data not found. Please log in again.");
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          router.push("/login");
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?.npk) {
          toast.error("Invalid user data. Please log in again.");
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
            toast.error("Your session has expired. Please log in again.");
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            localStorage.removeItem('user');
            router.push("/login");
          } else {
            throw new Error(`Failed to fetch profile: ${res.statusText}`);
          }
          return;
        }

        const data = await res.json();
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));

      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setFetchError("Failed to load user profile");
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
        toast.error("Token not found. Please log in again.")
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
          toast.error("Session expired. Please log in again.")
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          localStorage.removeItem('user')
          router.push("/login")
          return
        }

        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to update profile")
      }

      const updatedUser = await res.json()
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      toast.success("Profile updated successfully")
    } catch (error: any) {
      console.error("Failed to update profile:", error)
      toast.error(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return

    if (!password || !confirmPassword) {
      toast.error("Password cannot be empty")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const token = getToken()
      if (!token) {
        toast.error("Token not found. Please log in again.")
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
          toast.error("Session expired. Please log in again.")
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          localStorage.removeItem('user')
          router.push("/login")
          return
        }

        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to change password")
      }

      toast.success("Password changed successfully")
      setPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Failed to change password:", error)
      toast.error(error.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.removeItem('user')
    router.push('/login')
    toast.success("Successfully logged out")
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
                  <BreadcrumbPage>User Management</BreadcrumbPage>
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
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-2xl">User Profile</CardTitle>
                </div>
                <CardDescription>
                  Manage your profile information and account credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fetchLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Loading profile...</p>
                    </div>
                  </div>
                ) : fetchError ? (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-muted-foreground">{fetchError}</p>
                  </div>
                ) : user ? (
                  <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="profile" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        User Information
                      </TabsTrigger>
                      <TabsTrigger value="credentials" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Credentials
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
                            {loading ? "Saving..." : "Save Changes"}
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
                            Make sure your password is strong and unique. At least 6 characters.
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
                              {loading ? "Saving..." : "Change Password"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-muted-foreground">User data not found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
