import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { KeyRound, Eye, EyeOff, Copy, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminPasswordDialogProps {
  userId: string;
  userName: string;
}

function generatePassword(length = 16): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

export const AdminPasswordDialog = ({ userId, userName }: AdminPasswordDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerate = () => {
    const pwd = generatePassword(16);
    setPassword(pwd);
    setShowPassword(true);
  };

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    toast.success(t("admin.passwordCopied"));
  };

  const handleSave = async () => {
    if (password.length < 8) {
      toast.error(t("admin.passwordTooShort"));
      return;
    }
    setSaving(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=set-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId, password }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed");
      }
      toast.success(t("admin.passwordUpdated"));
      setPassword("");
      setShowPassword(false);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(t("admin.passwordUpdateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <KeyRound className="h-3 w-3 mr-1" />
          {t("admin.setPassword")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.setPasswordTitle", { name: userName })}</DialogTitle>
          <DialogDescription>{t("admin.setPasswordDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="admin-new-password">{t("admin.newPassword")}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="admin-new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("admin.newPasswordPlaceholder")}
                autoComplete="new-password"
                maxLength={72}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t("admin.hidePassword") : t("admin.showPassword")}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={!password}
              aria-label={t("admin.copyPassword")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            {t("admin.generate")}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            {t("admin.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || password.length < 8}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("admin.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
