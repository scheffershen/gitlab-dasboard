import { NavItem } from 'types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Activity',
    url: '/dashboard/activity',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['a', 'a'],
    items: [] // Empty array as there are no child items for Dashboard
  }
];

