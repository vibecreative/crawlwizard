import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Save, Loader2, Sparkles, Building2, MessageSquare, Users, Trophy, FileText, Ban, BookOpen } from "lucide-react";

interface BrandKnowledgeProps {
  projectId: string;
}

interface BrandData {
  company_description: string;
  tone_of_voice: string;
  target_audience: string;
  usps: string;
  key_messages: string;
  preferred_terms: string;
  avoided_terms: string;
  example_texts: string;
}

const emptyBrand: BrandData = {
  company_description: "",
  tone_of_voice: "",
  target_audience: "",
  usps: "",
  key_messages: "",
  preferred_terms: "",
  avoided_terms: "",
  example_texts: "",
};

export const BrandKnowledge = ({ projectId }: BrandKnowledgeProps) => {
  const { t } = useTranslation();

  const fields: { key: keyof BrandData; label: string; icon: React.ReactNode; placeholder: string; description: string; multiline: boolean }[] = [
    { key: "company_description", label: t('brand.companyDescription'), icon: <Building2 className="h-4 w-4" />, placeholder: t('brand.companyDescPlaceholder'), description: t('brand.companyDescHelp'), multiline: true },
    { key: "tone_of_voice", label: t('brand.toneOfVoice'), icon: <MessageSquare className="h-4 w-4" />, placeholder: t('brand.toneOfVoicePlaceholder'), description: t('brand.toneOfVoiceHelp'), multiline: false },
    { key: "target_audience", label: t('brand.targetAudience'), icon: <Users className="h-4 w-4" />, placeholder: t('brand.targetAudiencePlaceholder'), description: t('brand.targetAudienceHelp'), multiline: true },
    { key: "usps", label: t('brand.usps'), icon: <Trophy className="h-4 w-4" />, placeholder: t('brand.uspsPlaceholder'), description: t('brand.uspsHelp'), multiline: true },
    { key: "key_messages", label: t('brand.keyMessages'), icon: <Sparkles className="h-4 w-4" />, placeholder: t('brand.keyMessagesPlaceholder'), description: t('brand.keyMessagesHelp'), multiline: true },
    { key: "preferred_terms", label: t('brand.preferredTerms'), icon: <BookOpen className="h-4 w-4" />, placeholder: t('brand.preferredTermsPlaceholder'), description: t('brand.preferredTermsHelp'), multiline: false },
    { key: "avoided_terms", label: t('brand.avoidedTerms'), icon: <Ban className="h-4 w-4" />, placeholder: t('brand.avoidedTermsPlaceholder'), description: t('brand.avoidedTermsHelp'), multiline: false },
    { key: "example_texts", label: t('brand.exampleTexts'), icon: <FileText className="h-4 w-4" />, placeholder: t('brand.exampleTextsPlaceholder'), description: t('brand.exampleTextsHelp'), multiline: true },
  ];

  const [data, setData] = useState<BrandData>(emptyBrand);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    fetchBrandKnowledge();
  }, [projectId]);

  const fetchBrandKnowledge = async () => {
    try {
      const { data: brand, error } = await supabase
        .from("project_brand_knowledge" as any)
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      if (brand) {
        const b = brand as any;
        setData({
          company_description: b.company_description || "",
          tone_of_voice: b.tone_of_voice || "",
          target_audience: b.target_audience || "",
          usps: b.usps || "",
          key_messages: b.key_messages || "",
          preferred_terms: b.preferred_terms || "",
          avoided_terms: b.avoided_terms || "",
          example_texts: b.example_texts || "",
        });
        setHasExisting(true);
      }
    } catch (err) {
      console.error("Error fetching brand knowledge:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (hasExisting) {
        const { error } = await supabase
          .from("project_brand_knowledge" as any)
          .update(data as any)
          .eq("project_id", projectId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("project_brand_knowledge" as any)
          .insert({ project_id: projectId, ...data } as any);
        if (error) throw error;
        setHasExisting(true);
      }
      toast.success(t('brand.saved'));
    } catch (err: any) {
      console.error("Error saving brand knowledge:", err);
      toast.error(t('brand.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (key: keyof BrandData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const filledCount = Object.values(data).filter(v => v.trim().length > 0).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          {t('common.loading')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('brand.title')}
            </CardTitle>
            <CardDescription>
              {t('brand.description')}
              <span className="ml-2 text-xs text-muted-foreground">({filledCount}/{fields.length} {t('brand.filled')})</span>
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {t('brand.save')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["company_description", "tone_of_voice"]}>
          {fields.map((field) => (
            <AccordionItem key={field.key} value={field.key}>
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-2">
                  {field.icon}
                  <span>{field.label}</span>
                  {data[field.key].trim() && (
                    <span className="text-xs text-emerald-500 font-normal">✓</span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-muted-foreground">{field.description}</Label>
                  {field.multiline ? (
                    <Textarea
                      value={data[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <Input
                      value={data[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
