export const ROLE = {
  ADMIN: 1,
  SLL: 2,
  TM: 3,
  CON: 4,
};

export const ROLE_KEY = {
  [ROLE.ADMIN]: 'admin',
  [ROLE.SLL]: 'sll',
  [ROLE.TM]: 'tm',
  [ROLE.CON]: 'con',
};

export const ROLE_PRIORITY = [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON];
