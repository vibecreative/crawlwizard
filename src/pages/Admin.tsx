import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield, Users, LogOut, ArrowLeft, UserCheck, UserX, Crown, Trash2, RotateCcw, Mail, Eye, EyeOff,
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

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const Admin = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
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
      await Promise.all([fetchUsers(), fetchMessages()]);
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

      if (!response.ok) throw new Error("Failed to fetch users");
      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t('admin.usersLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const toggleMessageRead = async (id: string, currentRead: boolean) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: !currentRead })
        .eq("id", id);

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: !currentRead } : m));
    } catch {
      toast.error(t('admin.statusUpdateFailed'));
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success(t('admin.messageDeleted'));
    } catch {
      toast.error(t('admin.messageDeleteFailed'));
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
      toast.success(t('admin.userUpdated'));
      await fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(t('admin.userUpdateFailed'));
    } finally {
      setUpdatingUser(null);
    }
  };

  const resetCredits = async (userId: string) => {
    setUpdatingUser(userId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=reset-credits`,
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

      if (!response.ok) throw new Error("Reset failed");
      toast.success(t('admin.creditsReset'));
    } catch (error) {
      console.error("Error resetting credits:", error);
      toast.error(t('admin.creditsResetFailed'));
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
      toast.success(t('admin.userDeleted'));
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(t('admin.userDeleteFailed'));
    } finally {
      setUpdatingUser(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const locale = i18n.language === 'nl' ? 'nl-NL' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {
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
            <h2 className="text-xl font-bold mb-2">{t('admin.noAccess')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('admin.noAccessDesc')}
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('analysis.backToDashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.totalUsers')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('admin.active')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('admin.blocked')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('admin.admins')}</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.roles.includes("admin")).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t('admin.users')}
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <Mail className="h-4 w-4" />
              {t('admin.messages')}
              {messages.filter(m => !m.is_read).length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                  {messages.filter(m => !m.is_read).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.userManagement')}</CardTitle>
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
                        <TableHead>{t('admin.user')}</TableHead>
                        <TableHead>{t('admin.registered')}</TableHead>
                        <TableHead>{t('admin.lastActive')}</TableHead>
                        <TableHead>{t('admin.plan')}</TableHead>
                        <TableHead>{t('admin.role')}</TableHead>
                        <TableHead>{t('admin.status')}</TableHead>
                        <TableHead>{t('admin.actions')}</TableHead>
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
                              {u.is_active ? t('admin.active') : t('admin.blocked')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => navigate(`/dashboard?viewAs=${u.id}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {t('admin.viewAs')}
                              </Button>
                              <Button
                                variant={u.is_active ? "destructive" : "default"}
                                size="sm"
                                className="h-8 text-xs"
                                disabled={updatingUser === u.id || u.id === user?.id}
                                onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                              >
                                {u.is_active ? t('admin.block') : t('admin.activate')}
                              </Button>
                              {!u.roles.includes("admin") && u.id !== user?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  disabled={updatingUser === u.id}
                                  onClick={() => updateUser(u.id, { role: "admin" })}
                                >
                                  {t('admin.makeAdmin')}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                disabled={updatingUser === u.id}
                                onClick={() => resetCredits(u.id)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                {t('admin.resetCredits')}
                              </Button>
                              {u.id !== user?.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                      disabled={updatingUser === u.id}
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      {t('admin.delete')}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('admin.deleteUserConfirm')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('admin.deleteUserDesc', { name: u.full_name || u.email }).replace('<1>', '').replace('</1>', '')}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUser(u.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {t('common.delete')}
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
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {t('admin.contactMessages')}
                  {messages.filter(m => !m.is_read).length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {messages.filter(m => !m.is_read).length} {t('admin.unread')}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('admin.noMessages')}</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`border rounded-lg p-4 ${!msg.is_read ? "border-primary/50 bg-primary/5" : "border-border"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{msg.name}</span>
                              {!msg.is_read && (
                                <Badge variant="default" className="text-xs">{t('admin.new')}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{msg.email}</p>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(msg.created_at).toLocaleString(i18n.language === 'nl' ? "nl-NL" : "en-US")}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleMessageRead(msg.id, msg.is_read)}
                              title={msg.is_read ? t('admin.markUnread') : t('admin.markRead')}
                            >
                              {msg.is_read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('admin.deleteMessage')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('admin.deleteMessageDesc', { name: msg.name }).replace('<1>', '').replace('</1>', '')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMessage(msg.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t('common.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
