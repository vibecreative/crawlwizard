import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, CheckCircle } from "lucide-react";
import { z } from "zod";

const ContactForm = () => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactSchema = z.object({
    name: z.string().trim().min(1, t('contact.nameRequired')).max(100, t('contact.nameMax')),
    email: z.string().trim().email(t('contact.invalidEmail')).max(255, t('contact.emailMax')),
    message: z.string().trim().min(10, t('contact.messageMin')).max(2000, t('contact.messageMax')),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse({ name, email, message });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert({ name: result.data.name, email: result.data.email, message: result.data.message });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success(t('contact.sent'));
    } catch {
      toast.error(t('contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-1">{t('contact.thankYou')}</h3>
        <p className="text-sm text-muted-foreground">{t('contact.willReply')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">{t('contact.name')}</Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('contact.namePlaceholder')}
            maxLength={100}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">{t('contact.email')}</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('contact.emailPlaceholder')}
            maxLength={255}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">{t('contact.message')}</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('contact.messagePlaceholder')}
          rows={4}
          maxLength={2000}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        <Send className="w-4 h-4 mr-2" />
        {isSubmitting ? t('contact.sending') : t('contact.send')}
      </Button>
    </form>
  );
};

export default ContactForm;
