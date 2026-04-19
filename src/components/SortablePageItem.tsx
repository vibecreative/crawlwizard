import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink, GripVertical } from "lucide-react";

interface SortablePageItemProps {
  page: {
    id: string;
    url: string;
    title: string | null;
    seo_score: number | null;
    has_h1: boolean;
    has_meta_description: boolean;
    has_structured_data: boolean;
  };
  getScoreBg: (score: number | null) => string;
  getScoreColor: (score: number | null) => string;
}

export const SortablePageItem = ({ page, getScoreBg, getScoreColor }: SortablePageItemProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing p-1 mr-1 text-muted-foreground hover:text-foreground"
        aria-label="Verschuif pagina"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div
        className="flex-1 min-w-0 mr-2 sm:mr-3 cursor-pointer hover:text-primary transition-colors"
        onClick={() => navigate(`/page/${page.id}`)}
      >
        <p className="text-[11px] sm:text-xs font-medium truncate">
          {page.title || (() => { try { return new URL(page.url).pathname || "/"; } catch { return page.url; } })()}
        </p>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{page.url}</p>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5">
          <Badge className={`text-[10px] h-5 px-1.5 border ${page.has_h1 ? "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20" : "bg-destructive text-destructive-foreground border-transparent"}`}>H1</Badge>
          <Badge className={`text-[10px] h-5 px-1.5 border ${page.has_meta_description ? "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20" : "bg-destructive text-destructive-foreground border-transparent"}`}>Meta</Badge>
          <Badge className={`text-[10px] h-5 px-1.5 border ${page.has_structured_data ? "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20" : "bg-destructive text-destructive-foreground border-transparent"}`}>Schema</Badge>
        </div>
        <div className={`w-8 sm:w-9 text-center py-0.5 rounded ${getScoreBg(page.seo_score)}`}>
          <span className={`text-[10px] sm:text-xs font-bold ${getScoreColor(page.seo_score)}`}>
            {page.seo_score ?? "-"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] px-1.5 sm:px-2"
          onClick={() => navigate(`/page/${page.id}`)}
        >
          <Eye className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">{t('dashboard.details')}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hidden sm:flex"
          onClick={() => window.open(page.url, "_blank")}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
