import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRolePermissions, PERMISSION_LABELS, ALL_PERMISSION_KEYS, ROLE_LABELS, STAFF_ROLES } from "@/hooks/useRolePermissions";
import { Users, Search, Shield, User, Trash2, Loader2, MapPin, Filter, X, UserPlus, Settings2, Eye, EyeOff, CheckCircle, Ban, Activity } from "lucide-react";
import { divisions, districtsByDivision, upazilasByDistrict } from "@/data/bangladeshLocationData";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { UserBlockDialog } from "@/components/admin/UserBlockDialog";
import { UserActivityLog } from "@/components/admin/UserActivityLog";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  mobile: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  village: string | null;
  created_at: string;
  role?: string;
  is_blocked?: boolean;
  blocked_until?: string | null;
  block_reason?: string | null;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedUpazila, setSelectedUpazila] = useState<string>("");

  // Create user dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "", password: "", full_name: "", mobile: "", role: "cashier" as string,
  });
  const [showPassword, setShowPassword] = useState(false);

  // Block/Activity dialogs
  const [blockDialogUser, setBlockDialogUser] = useState<UserProfile | null>(null);
  const [activityLogUser, setActivityLogUser] = useState<UserProfile | null>(null);

  // Role permissions
  const { permissions, isLoading: permLoading, getPermissionsForRole, updatePermission, refetch: refetchPerms } = useRolePermissions();
  const [editingRole, setEditingRole] = useState<string>("manager");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const usersWithRoles = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return { ...profile, role: userRole?.role || "user" };
      });
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "ত্রুটি", description: "ব্যবহারকারী লোড করতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole } as any)
        .eq("user_id", userId);
      if (error) throw error;

      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, role: newRole } : u));
      toast({ title: "সফল", description: "ভূমিকা আপডেট হয়েছে" });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({ title: "ত্রুটি", description: "ভূমিকা আপডেট করতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      toast({ title: "সফল", description: "ব্যবহারকারী মুছে ফেলা হয়েছে" });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "ত্রুটি", description: "ব্যবহারকারী মুছতে সমস্যা হয়েছে", variant: "destructive" });
    }
  };

  const createStaffUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast({ title: "ত্রুটি", description: "সকল প্রয়োজনীয় তথ্য পূরণ করুন", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      // Create user via Supabase Auth admin (using edge function)
      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: {
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          mobile: newUser.mobile,
          role: newUser.role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "সফল", description: `${ROLE_LABELS[newUser.role] || newUser.role} তৈরি হয়েছে` });
      setShowCreateDialog(false);
      setNewUser({ email: "", password: "", full_name: "", mobile: "", role: "cashier" });
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({ title: "ত্রুটি", description: error.message || "ব্যবহারকারী তৈরি করতে সমস্যা হয়েছে", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const rolePerms = useMemo(() => getPermissionsForRole(editingRole), [editingRole, permissions, getPermissionsForRole]);

  const handlePermissionToggle = async (permKey: string, checked: boolean) => {
    const success = await updatePermission(editingRole, permKey, checked);
    if (success) {
      toast({ title: "সফল", description: "পারমিশন আপডেট হয়েছে" });
    }
  };

  // Filters
  const availableDistricts = useMemo(() => selectedDivision ? districtsByDivision[selectedDivision] || [] : [], [selectedDivision]);
  const availableUpazilas = useMemo(() => selectedDistrict ? upazilasByDistrict[selectedDistrict] || [] : [], [selectedDistrict]);

  const handleDivisionChange = (v: string) => { setSelectedDivision(v); setSelectedDistrict(""); setSelectedUpazila(""); };
  const handleDistrictChange = (v: string) => { setSelectedDistrict(v); setSelectedUpazila(""); };
  const clearFilters = () => { setSelectedDivision(""); setSelectedDistrict(""); setSelectedUpazila(""); setSearchTerm(""); };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.mobile?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesDivision = !selectedDivision || user.division === selectedDivision;
      const matchesDistrict = !selectedDistrict || user.district === selectedDistrict;
      const matchesUpazila = !selectedUpazila || user.upazila === selectedUpazila;
      return matchesSearch && matchesDivision && matchesDistrict && matchesUpazila;
    });
  }, [users, searchTerm, selectedDivision, selectedDistrict, selectedUpazila]);

  const locationStats = useMemo(() => {
    const divisionCount = new Set(users.map(u => u.division).filter(Boolean)).size;
    const districtCount = new Set(users.map(u => u.district).filter(Boolean)).size;
    return { divisionCount, districtCount };
  }, [users]);

  const hasActiveFilters = selectedDivision || selectedDistrict || selectedUpazila || searchTerm;

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500 text-white",
      manager: "bg-blue-500 text-white",
      cashier: "bg-green-500 text-white",
      delivery_staff: "bg-orange-500 text-white",
      farmer: "bg-emerald-600 text-white",
      customer: "bg-purple-500 text-white",
    };
    return (
      <Badge className={colors[role] || "bg-muted text-muted-foreground"}>
        {role === "admin" && <Shield className="h-3 w-3 mr-1" />}
        {ROLE_LABELS[role] || role}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ব্যবহারকারী ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground">
              ব্যবহারকারী তৈরি, ভূমিকা নির্ধারণ এবং পারমিশন পরিচালনা করুন
              <span className="ml-2 text-xs">
                ({locationStats.divisionCount} বিভাগ, {locationStats.districtCount} জেলা)
              </span>
            </p>
          </div>

          {/* Create User Button */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                নতুন স্টাফ তৈরি করুন
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  নতুন স্টাফ অ্যাকাউন্ট তৈরি
                </DialogTitle>
                <DialogDescription>
                  ম্যানেজার, ক্যাশিয়ার বা ডেলিভারি স্টাফ তৈরি করুন
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>পুরো নাম *</Label>
                  <Input
                    placeholder="নাম লিখুন"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser(p => ({ ...p, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>ইমেইল *</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>পাসওয়ার্ড *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="পাসওয়ার্ড দিন"
                      value={newUser.password}
                      onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>মোবাইল নম্বর</Label>
                  <Input
                    placeholder="01XXXXXXXXX"
                    value={newUser.mobile}
                    onChange={(e) => setNewUser(p => ({ ...p, mobile: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>ভূমিকা *</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser(p => ({ ...p, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>বাতিল</Button>
                <Button onClick={createStaffUser} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  তৈরি করুন
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />ব্যবহারকারী তালিকা</TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2"><Settings2 className="h-4 w-4" />রোল পারমিশন</TabsTrigger>
          </TabsList>

          {/* === Users Tab === */}
          <TabsContent value="users" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5 text-primary" />
                  ফিল্টার অপশন
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="নাম, ইমেইল বা মোবাইল..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                    <SelectTrigger><MapPin className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="বিভাগ নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>{divisions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={selectedDistrict} onValueChange={handleDistrictChange} disabled={!selectedDivision}>
                    <SelectTrigger><MapPin className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder={selectedDivision ? "জেলা" : "প্রথমে বিভাগ নির্বাচন"} /></SelectTrigger>
                    <SelectContent>{availableDistricts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={selectedUpazila} onValueChange={setSelectedUpazila} disabled={!selectedDistrict}>
                    <SelectTrigger><MapPin className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder={selectedDistrict ? "উপজেলা" : "প্রথমে জেলা নির্বাচন"} /></SelectTrigger>
                    <SelectContent>{availableUpazilas.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">সক্রিয় ফিল্টার:</span>
                    {selectedDivision && <Badge variant="secondary">{selectedDivision}</Badge>}
                    {selectedDistrict && <Badge variant="secondary">{selectedDistrict}</Badge>}
                    {selectedUpazila && <Badge variant="secondary">{selectedUpazila}</Badge>}
                    {searchTerm && <Badge variant="secondary">"{searchTerm}"</Badge>}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-destructive hover:text-destructive">
                      <X className="h-4 w-4 mr-1" />ফিল্টার মুছুন
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-500" />
                  ব্যবহারকারী তালিকা
                </CardTitle>
                <CardDescription>
                  {hasActiveFilters
                    ? `ফিল্টার করা ${filteredUsers.length} জন (মোট ${users.length} জন)`
                    : `মোট ${filteredUsers.length} জন ব্যবহারকারী`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {(user.full_name || user.email || "U")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{user.full_name || "নাম নেই"}</p>
                              {getRoleBadge(user.role || "user")}
                              {user.is_blocked && (
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  ব্লকড
                                  {user.blocked_until && ` (${new Date(user.blocked_until).toLocaleDateString("bn-BD")} পর্যন্ত)`}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.mobile && <p className="text-sm text-muted-foreground">{user.mobile}</p>}
                            {(user.division || user.district || user.upazila) && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 text-primary" />
                                <p className="text-xs text-primary">
                                  {[user.upazila, user.district, user.division].filter(Boolean).join(", ")}
                                </p>
                              </div>
                            )}
                            {user.block_reason && user.is_blocked && (
                              <p className="text-xs text-destructive mt-1">কারণ: {user.block_reason}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              যোগদান: {new Date(user.created_at).toLocaleDateString("bn-BD")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <Button variant="outline" size="icon" title="অ্যাক্টিভিটি লগ" onClick={() => setActivityLogUser(user)}>
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={user.is_blocked ? "default" : "outline"}
                            size="icon"
                            title={user.is_blocked ? "আনব্লক করুন" : "ব্লক করুন"}
                            onClick={() => setBlockDialogUser(user)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                          <Select value={user.role} onValueChange={(value) => updateUserRole(user.user_id, value)} disabled={updatingUserId === user.user_id}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">সাধারণ ব্যবহারকারী</SelectItem>
                              <SelectItem value="farmer">কৃষক</SelectItem>
                              <SelectItem value="customer">কাস্টমার</SelectItem>
                              <SelectItem value="manager">ম্যানেজার</SelectItem>
                              <SelectItem value="cashier">ক্যাশিয়ার</SelectItem>
                              <SelectItem value="delivery_staff">ডেলিভারি স্টাফ</SelectItem>
                              <SelectItem value="admin">সুপার অ্যাডমিন</SelectItem>
                            </SelectContent>
                          </Select>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>ব্যবহারকারী মুছে ফেলবেন?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  এই কার্যক্রম পূর্বাবস্থায় ফেরানো যাবে না। সমস্ত ডেটা মুছে যাবে।
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUser(user.user_id)} className="bg-destructive hover:bg-destructive/90">
                                  মুছে ফেলুন
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {hasActiveFilters ? "এই ফিল্টারে কোনো ব্যবহারকারী পাওয়া যায়নি" : "কোনো ব্যবহারকারী পাওয়া যায়নি"}
                    </p>
                    {hasActiveFilters && <Button variant="link" onClick={clearFilters} className="mt-2">ফিল্টার মুছুন</Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === Permissions Tab === */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  রোল পারমিশন ব্যবস্থাপনা
                </CardTitle>
                <CardDescription>
                  প্রতিটি রোলের জন্য কোন কোন মেনু/অপশন ব্যবহার করতে পারবে তা নির্ধারণ করুন
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Role selector */}
                <div className="mb-6">
                  <Label className="mb-2 block">রোল নির্বাচন করুন</Label>
                  <div className="flex flex-wrap gap-2">
                    {STAFF_ROLES.map((role) => (
                      <Button
                        key={role}
                        variant={editingRole === role ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditingRole(role)}
                        className="gap-2"
                      >
                        {editingRole === role && <CheckCircle className="h-4 w-4" />}
                        {ROLE_LABELS[role]}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Permission checkboxes */}
                {permLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ALL_PERMISSION_KEYS.map((key) => (
                        <div
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            rolePerms[key]
                              ? "bg-primary/5 border-primary/20"
                              : "bg-muted/30 border-border"
                          }`}
                        >
                          <Checkbox
                            id={`perm-${key}`}
                            checked={rolePerms[key] || false}
                            onCheckedChange={(checked) => handlePermissionToggle(key, !!checked)}
                          />
                          <Label htmlFor={`perm-${key}`} className="cursor-pointer text-sm font-medium flex-1">
                            {PERMISSION_LABELS[key]}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <Shield className="h-4 w-4 inline mr-1 text-red-500" />
                        <strong>সুপার অ্যাডমিন</strong> সবসময় সকল মেনু ও অপশনে পূর্ণ অ্যাক্সেস পাবেন। পারমিশন শুধুমাত্র স্টাফ রোল (ম্যানেজার, ক্যাশিয়ার, ডেলিভারি স্টাফ) এর জন্য প্রযোজ্য।
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Block Dialog */}
        {blockDialogUser && (
          <UserBlockDialog
            open={!!blockDialogUser}
            onOpenChange={(open) => !open && setBlockDialogUser(null)}
            userId={blockDialogUser.user_id}
            userName={blockDialogUser.full_name || blockDialogUser.email || "ইউজার"}
            isCurrentlyBlocked={!!blockDialogUser.is_blocked}
            onSuccess={fetchUsers}
          />
        )}

        {/* Activity Log Dialog */}
        {activityLogUser && (
          <UserActivityLog
            open={!!activityLogUser}
            onOpenChange={(open) => !open && setActivityLogUser(null)}
            userId={activityLogUser.user_id}
            userName={activityLogUser.full_name || activityLogUser.email || "ইউজার"}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
