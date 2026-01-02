import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Shield, User, Trash2, Loader2, MapPin, Filter, X } from "lucide-react";
import { divisions, districtsByDivision, upazilasByDistrict } from "@/data/bangladeshLocationData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // Location filters
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedUpazila, setSelectedUpazila] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles with all location fields
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || "user",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "ত্রুটি",
        description: "ব্যবহারকারী লোড করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      // Update the role
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as "admin" | "user" })
        .eq("user_id", userId);

      if (error) throw error;

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId ? { ...user, role: newRole } : user
        )
      );

      toast({
        title: "সফল",
        description: "ব্যবহারকারীর ভূমিকা আপডেট হয়েছে",
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "ত্রুটি",
        description: "ভূমিকা আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete from profiles (cascade will handle user_roles)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setUsers((prev) => prev.filter((user) => user.user_id !== userId));

      toast({
        title: "সফল",
        description: "ব্যবহারকারী মুছে ফেলা হয়েছে",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "ত্রুটি",
        description: "ব্যবহারকারী মুছতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    }
  };

  // Get available districts based on selected division
  const availableDistricts = useMemo(() => {
    if (!selectedDivision) return [];
    return districtsByDivision[selectedDivision] || [];
  }, [selectedDivision]);

  // Get available upazilas based on selected district
  const availableUpazilas = useMemo(() => {
    if (!selectedDistrict) return [];
    return upazilasByDistrict[selectedDistrict] || [];
  }, [selectedDistrict]);

  // Reset dependent filters when parent changes
  const handleDivisionChange = (value: string) => {
    setSelectedDivision(value);
    setSelectedDistrict("");
    setSelectedUpazila("");
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedUpazila("");
  };

  const clearFilters = () => {
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedUpazila("");
    setSearchTerm("");
  };

  // Filter users based on all criteria
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const matchesSearch =
        (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.mobile?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      // Location filters
      const matchesDivision = !selectedDivision || user.division === selectedDivision;
      const matchesDistrict = !selectedDistrict || user.district === selectedDistrict;
      const matchesUpazila = !selectedUpazila || user.upazila === selectedUpazila;

      return matchesSearch && matchesDivision && matchesDistrict && matchesUpazila;
    });
  }, [users, searchTerm, selectedDivision, selectedDistrict, selectedUpazila]);

  // Get unique locations from users for statistics
  const locationStats = useMemo(() => {
    const divisionCount = new Set(users.map(u => u.division).filter(Boolean)).size;
    const districtCount = new Set(users.map(u => u.district).filter(Boolean)).size;
    return { divisionCount, districtCount };
  }, [users]);

  const hasActiveFilters = selectedDivision || selectedDistrict || selectedUpazila || searchTerm;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ব্যবহারকারী ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground">
              সকল নিবন্ধিত ব্যবহারকারী দেখুন এবং পরিচালনা করুন
              <span className="ml-2 text-xs">
                ({locationStats.divisionCount} বিভাগ, {locationStats.districtCount} জেলা থেকে)
              </span>
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-primary" />
              ফিল্টার অপশন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="নাম, ইমেইল বা মোবাইল..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Division Filter */}
              <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* District Filter */}
              <Select 
                value={selectedDistrict} 
                onValueChange={handleDistrictChange}
                disabled={!selectedDivision}
              >
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder={selectedDivision ? "জেলা নির্বাচন করুন" : "প্রথমে বিভাগ নির্বাচন করুন"} />
                </SelectTrigger>
                <SelectContent>
                  {availableDistricts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Upazila Filter */}
              <Select 
                value={selectedUpazila} 
                onValueChange={setSelectedUpazila}
                disabled={!selectedDistrict}
              >
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder={selectedDistrict ? "উপজেলা নির্বাচন করুন" : "প্রথমে জেলা নির্বাচন করুন"} />
                </SelectTrigger>
                <SelectContent>
                  {availableUpazilas.map((upazila) => (
                    <SelectItem key={upazila} value={upazila}>
                      {upazila}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters & Clear Button */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">সক্রিয় ফিল্টার:</span>
                {selectedDivision && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedDivision}
                  </Badge>
                )}
                {selectedDistrict && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedDistrict}
                  </Badge>
                )}
                {selectedUpazila && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedUpazila}
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchTerm}"
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  ফিল্টার মুছুন
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
                ? `ফিল্টার করা ${filteredUsers.length} জন ব্যবহারকারী (মোট ${users.length} জন)`
                : `মোট ${filteredUsers.length} জন ব্যবহারকারী`
              }
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
                  <div
                    key={user.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {(user.full_name || user.email || "U")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{user.full_name || "নাম নেই"}</p>
                          <Badge
                            variant={user.role === "admin" ? "default" : "secondary"}
                            className={user.role === "admin" ? "bg-violet-500" : ""}
                          >
                            {user.role === "admin" ? (
                              <><Shield className="h-3 w-3 mr-1" /> অ্যাডমিন</>
                            ) : (
                              <><User className="h-3 w-3 mr-1" /> ব্যবহারকারী</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.mobile && (
                          <p className="text-sm text-muted-foreground">{user.mobile}</p>
                        )}
                        {/* Location Info */}
                        {(user.division || user.district || user.upazila) && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            <p className="text-xs text-primary">
                              {[user.upazila, user.district, user.division]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          যোগদান: {new Date(user.created_at).toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.user_id, value)}
                        disabled={updatingUserId === user.user_id}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">ব্যবহারকারী</SelectItem>
                          <SelectItem value="admin">অ্যাডমিন</SelectItem>
                        </SelectContent>
                      </Select>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ব্যবহারকারী মুছে ফেলবেন?</AlertDialogTitle>
                            <AlertDialogDescription>
                              এই কার্যক্রম পূর্বাবস্থায় ফেরানো যাবে না। ব্যবহারকারীর সমস্ত ডেটা মুছে যাবে।
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(user.user_id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
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
                  {hasActiveFilters 
                    ? "এই ফিল্টারে কোনো ব্যবহারকারী পাওয়া যায়নি"
                    : "কোনো ব্যবহারকারী পাওয়া যায়নি"
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    ফিল্টার মুছুন
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
