export interface SidebarItem {
  label: string;
  icon: string;
  path: string;
  permission?: string; // Optional permission required to see this item
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export type SidebarVariant = 'desktop' | 'mobile' | 'collapsed';

export interface SidebarProps {
  variant?: SidebarVariant;
  onItemClick?: (item: SidebarItem) => void;
}