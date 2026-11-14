// Fictional, local-only sample data for preview compositions. No real people,
// events, or backend. Nothing here is sent anywhere.
export type FollowUpStatus = 'to-reach' | 'reached-out' | 'talking' | 'done';

export type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
  event: string;
  metOn: string;
  note: string;
  due: 'overdue' | 'today' | 'this-week' | 'later';
  dueLabel: string;
  status: FollowUpStatus;
};

export const STATUS_LABELS: Record<FollowUpStatus, string> = {
  'to-reach': 'To reach out',
  'reached-out': 'Reached out',
  talking: 'In conversation',
  done: 'Followed through',
};

export const SAMPLE_PEOPLE: Person[] = [
  {
    id: 'p1',
    name: 'Mara Lindqvist',
    initials: 'ML',
    role: 'Ceramicist',
    event: 'Harbor Makers Night',
    metOn: 'Met Sat, Oct 12',
    note: 'Asked about the community kiln schedule. Offered to share studio contacts.',
    due: 'overdue',
    dueLabel: 'Overdue by 2 days',
    status: 'to-reach',
  },
  {
    id: 'p2',
    name: 'Theo Okafor',
    initials: 'TO',
    role: 'Product designer',
    event: 'Quiet Design Breakfast',
    metOn: 'Met Tue, Oct 15',
    note: 'Both reading the same book on rest. Suggested a walk and a chat.',
    due: 'today',
    dueLabel: 'Due today',
    status: 'reached-out',
  },
  {
    id: 'p3',
    name: 'Ines Park',
    initials: 'IP',
    role: 'Community organizer',
    event: 'Neighborhood Garden Swap',
    metOn: 'Met Sun, Oct 13',
    note: 'Looking for volunteers for spring planting. Share the seed library idea.',
    due: 'this-week',
    dueLabel: 'Due Thursday',
    status: 'talking',
  },
  {
    id: 'p4',
    name: 'Rafael Duarte',
    initials: 'RD',
    role: 'Jazz pianist',
    event: 'Late Set at the Linden',
    metOn: 'Met Fri, Oct 4',
    note: 'Thanked him for the recommendation list. Promised to send a recording.',
    due: 'later',
    dueLabel: 'Next week',
    status: 'done',
  },
];
