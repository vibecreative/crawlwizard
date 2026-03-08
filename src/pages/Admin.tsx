import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
import {
  Shield,
  Users,
  LogOut,
  ArrowLeft,
  UserCheck,
  UserX,
  Crown,
  Trash2,
  RotateCcw,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  company_name: string | null;
  is_active: boolean;
  plan: string;
  roles: string[];
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      // Check if current user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin");

      if (!roleData || roleData.length === 0) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchUsers();
    } catch (error) {
      console.error("Error checking admin:", error);
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Kon gebruikers niet laden");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: { is_active?: boolean; plan?: string; role?: string }) => {
    setUpdatingUser(userId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId, ...updates }),
        }
      );

      if (!response.ok) throw new Error("Update failed");

      toast.success("Gebruiker bijgewerkt");
      await fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Kon gebruiker niet bijwerken");
    } finally {
      setUpdatingUser(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setUpdatingUser(userId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=delete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) throw new Error("Delete failed");

      toast.success("Gebruiker verwijderd");
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Kon gebruiker niet verwijderen");
    } finally {
      setUpdatingUser(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Geen toegang</h2>
            <p className="text-muted-foreground mb-6">
              Je hebt geen admin-rechten om deze pagina te bekijken.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totaal gebruikers</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <UserCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actief</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <UserX className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Geblokkeerd</p>
                  <p className="text-2xl font-bold">{users.filter(u => !u.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <Crown className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.roles.includes("admin")).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gebruikersbeheer</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gebruiker</TableHead>
                    <TableHead>Geregistreerd</TableHead>
                    <TableHead>Laatst actief</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className={!u.is_active ? "opacity-60" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.full_name || "-"}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(u.created_at)}</TableCell>
                      <TableCell>{formatDate(u.last_sign_in_at)}</TableCell>
                      <TableCell>
                        <Select
                          value={u.plan}
                          onValueChange={(value) => updateUser(u.id, { plan: value })}
                          disabled={updatingUser === u.id}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="scale">Scale</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.roles.includes("admin") ? "default" : "secondary"}>
                          {u.roles.includes("admin") ? "Admin" : "User"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "default" : "destructive"}>
                          {u.is_active ? "Actief" : "Geblokkeerd"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant={u.is_active ? "destructive" : "default"}
                            size="sm"
                            className="h-8 text-xs"
                            disabled={updatingUser === u.id || u.id === user?.id}
                            onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                          >
                            {u.is_active ? "Blokkeer" : "Activeer"}
                          </Button>
                          {!u.roles.includes("admin") && u.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={updatingUser === u.id}
                              onClick={() => updateUser(u.id, { role: "admin" })}
                            >
                              Maak admin
                            </Button>
                          )}
                          {u.id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-destructive hover:text-destructive"
                                  disabled={updatingUser === u.id}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Verwijder
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Gebruiker verwijderen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Weet je zeker dat je <strong>{u.full_name || u.email}</strong> wilt verwijderen? Dit verwijdert het account en alle bijbehorende data permanent.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser(u.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Verwijderen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
