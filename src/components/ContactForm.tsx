import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, CheckCircle } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Naam is verplicht").max(100, "Naam mag maximaal 100 tekens zijn"),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255, "E-mail mag maximaal 255 tekens zijn"),
  message: z.string().trim().min(10, "Bericht moet minimaal 10 tekens bevatten").max(2000, "Bericht mag maximaal 2000 tekens zijn"),
});

const ContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      toast.success("Bericht verzonden!");
    } catch {
      toast.error("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-1">Bedankt voor je bericht!</h3>
        <p className="text-sm text-muted-foreground">We nemen zo snel mogelijk contact met je op.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Naam</Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Je naam"
            maxLength={100}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">E-mailadres</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="je@email.nl"
            maxLength={255}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Bericht</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Waar kunnen we je mee helpen?"
          rows={4}
          maxLength={2000}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        <Send className="w-4 h-4 mr-2" />
        {isSubmitting ? "Verzenden..." : "Verstuur bericht"}
      </Button>
    </form>
  );
};

export default ContactForm;
