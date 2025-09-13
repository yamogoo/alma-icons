export type UIElementColor =
  | `${"primary" | "secondary"}${"" | "-inversed" | "-transparental"}`
  | `${"transclucent"}${"" | "-inversed"}`
  | `${"tertiary"}${"" | "-inversed"}`
  | "transparental"
  | "accent"
  | "accent-secondary"
  | "accept"
  | "disabled"
  | "warning"
  | "error"
  | "info";

export type UIElementSize =
  | "xxxs"
  | "xxs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxl";


export type UIElementVariant = "default";

export type UIElementSID<T = string | null | undefined> = T;

export type UIElementContentKey = string | number | Symbol;

export type UIElementTypographyTitleTag = `h${1 | 2 | 3 | 4 | 5 | 6}`;

export type UIElementTypographyLinkTag = "a";

export type UIElementTypographyListItemTag = "li" | "ol" | "ul";

export type UIElementTypographyParagraphTag = "p" | "span" | "a" | "b" | "i";

export type UIElementHeaderTag = "div" | "header" | "section";

export type UIElementFooterTag = "div" | "footer" | "section";

export type UIElementTypographyTag =
  | UIElementTypographyTitleTag
  | UIElementTypographyParagraphTag
  | UIElementTypographyLinkTag
  | UIElementTypographyListItemTag;

export interface UIElementUnionProps<V = UIElementVariant> {
  variant?: V;
}
