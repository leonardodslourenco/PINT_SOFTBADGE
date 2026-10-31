import { ROLE } from '../constants/roles';
import HeaderGlobal from '../views/HeaderGlobal';
import SidebarUniversal from './SidebarUniversal';

export const layoutByRole = {
  [ROLE.ADMIN]: { Header: HeaderGlobal, Sidebar: SidebarUniversal },
  [ROLE.SLL]: { Header: HeaderGlobal, Sidebar: SidebarUniversal },
  [ROLE.TM]: { Header: HeaderGlobal, Sidebar: SidebarUniversal },
  [ROLE.CON]: { Header: HeaderGlobal, Sidebar: SidebarUniversal },
};
