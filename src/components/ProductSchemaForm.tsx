import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package } from "lucide-react";

export type ProductPriceMode = "price" | "quote";
export type ProductCondition = "new" | "used" | "refurbished";
export type ProductAvailability = "InStock" | "OutOfStock" | "PreOrder";

export interface ProductInput {
  id: string;
  name: string;
  description: string;
  brand: string;
  sku: string;
  imageUrl: string;
  priceMode: ProductPriceMode;
  price: string;
  condition: ProductCondition;
  availability: ProductAvailability;
}

export const createEmptyProduct = (): ProductInput => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  brand: "",
  sku: "",
  imageUrl: "",
  priceMode: "price",
  price: "",
  condition: "new",
  availability: "InStock",
});

interface ProductSchemaFormProps {
  products: ProductInput[];
  onChange: (products: ProductInput[]) => void;
}

export const ProductSchemaForm = ({ products, onChange }: ProductSchemaFormProps) => {
  const { t } = useTranslation();

  const updateProduct = (id: string, patch: Partial<ProductInput>) => {
    onChange(products.map(p => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removeProduct = (id: string) => {
    onChange(products.filter(p => p.id !== id));
  };

  const addProduct = () => {
    onChange([...products, createEmptyProduct()]);
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/20">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {t("jsonLd.productsTitle")}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">{t("jsonLd.productsIntro")}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addProduct} className="gap-1 shrink-0">
          <Plus className="h-4 w-4" />
          {t("jsonLd.addProduct")}
        </Button>
      </div>

      {products.length === 0 && (
        <p className="text-sm text-muted-foreground italic py-4 text-center">
          {t("jsonLd.noProductsYet")}
        </p>
      )}

      {products.map((p, idx) => (
        <div key={p.id} className="p-4 rounded-lg border border-border bg-background space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {t("jsonLd.product")} #{idx + 1}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeProduct(p.id)}
              className="text-destructive hover:text-destructive gap-1 h-8"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("jsonLd.removeProduct")}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label htmlFor={`name-${p.id}`} className="text-xs">{t("jsonLd.productName")} *</Label>
              <Input
                id={`name-${p.id}`}
                value={p.name}
                onChange={e => updateProduct(p.id, { name: e.target.value })}
                placeholder={t("jsonLd.productNamePh")}
                maxLength={200}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={`desc-${p.id}`} className="text-xs">{t("jsonLd.productDescription")}</Label>
              <Textarea
                id={`desc-${p.id}`}
                value={p.description}
                onChange={e => updateProduct(p.id, { description: e.target.value })}
                placeholder={t("jsonLd.productDescriptionPh")}
                maxLength={1000}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor={`brand-${p.id}`} className="text-xs">{t("jsonLd.productBrand")}</Label>
              <Input
                id={`brand-${p.id}`}
                value={p.brand}
                onChange={e => updateProduct(p.id, { brand: e.target.value })}
                placeholder={t("jsonLd.productBrandPh")}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor={`sku-${p.id}`} className="text-xs">{t("jsonLd.productSku")}</Label>
              <Input
                id={`sku-${p.id}`}
                value={p.sku}
                onChange={e => updateProduct(p.id, { sku: e.target.value })}
                placeholder={t("jsonLd.productSkuPh")}
                maxLength={100}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={`img-${p.id}`} className="text-xs">{t("jsonLd.productImageUrl")}</Label>
              <Input
                id={`img-${p.id}`}
                type="url"
                value={p.imageUrl}
                onChange={e => updateProduct(p.id, { imageUrl: e.target.value })}
                placeholder={t("jsonLd.productImageUrlPh")}
                maxLength={500}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs mb-2 block">{t("jsonLd.productPriceMode")}</Label>
              <RadioGroup
                value={p.priceMode}
                onValueChange={(v) => updateProduct(p.id, { priceMode: v as ProductPriceMode })}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="price" id={`price-mode-${p.id}`} />
                  <Label htmlFor={`price-mode-${p.id}`} className="text-sm font-normal cursor-pointer">
                    {t("jsonLd.productPriceOption")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="quote" id={`quote-mode-${p.id}`} />
                  <Label htmlFor={`quote-mode-${p.id}`} className="text-sm font-normal cursor-pointer">
                    {t("jsonLd.productQuoteOption")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {p.priceMode === "price" && (
              <div>
                <Label htmlFor={`pr-${p.id}`} className="text-xs">{t("jsonLd.productPrice")} (EUR)</Label>
                <Input
                  id={`pr-${p.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={p.price}
                  onChange={e => updateProduct(p.id, { price: e.target.value })}
                  placeholder={t("jsonLd.productPricePh")}
                />
              </div>
            )}

            <div>
              <Label className="text-xs">{t("jsonLd.productCondition")}</Label>
              <Select
                value={p.condition}
                onValueChange={(v) => updateProduct(p.id, { condition: v as ProductCondition })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("jsonLd.productConditionNew")}</SelectItem>
                  <SelectItem value="used">{t("jsonLd.productConditionUsed")}</SelectItem>
                  <SelectItem value="refurbished">{t("jsonLd.productConditionRefurbished")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {p.priceMode === "price" && (
              <div className="md:col-span-2">
                <Label className="text-xs">{t("jsonLd.productAvailability")}</Label>
                <Select
                  value={p.availability}
                  onValueChange={(v) => updateProduct(p.id, { availability: v as ProductAvailability })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="InStock">{t("jsonLd.productAvailInStock")}</SelectItem>
                    <SelectItem value="OutOfStock">{t("jsonLd.productAvailOutOfStock")}</SelectItem>
                    <SelectItem value="PreOrder">{t("jsonLd.productAvailPreOrder")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const CONDITION_MAP: Record<ProductCondition, string> = {
  new: "https://schema.org/NewCondition",
  used: "https://schema.org/UsedCondition",
  refurbished: "https://schema.org/RefurbishedCondition",
};

export const buildProductSchema = (p: ProductInput, pageUrl: string) => {
  if (!p.name.trim()) return null;

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name.trim(),
  };
  if (p.description.trim()) schema.description = p.description.trim();
  if (p.imageUrl.trim()) schema.image = p.imageUrl.trim();
  if (p.sku.trim()) schema.sku = p.sku.trim();
  if (p.brand.trim()) {
    schema.brand = { "@type": "Brand", name: p.brand.trim() };
  }

  if (p.priceMode === "price" && p.price.trim()) {
    schema.offers = {
      "@type": "Offer",
      price: p.price.trim(),
      priceCurrency: "EUR",
      availability: `https://schema.org/${p.availability}`,
      itemCondition: CONDITION_MAP[p.condition],
      url: pageUrl,
    };
  } else if (p.priceMode === "quote") {
    schema.offers = {
      "@type": "Offer",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "EUR",
        price: "0",
        valueAddedTaxIncluded: true,
      },
      availability: "https://schema.org/InStock",
      itemCondition: CONDITION_MAP[p.condition],
      url: pageUrl,
      description: "Price on request",
    };
  }

  return schema;
};
