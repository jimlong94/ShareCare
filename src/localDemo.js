// Flip to false to restore Firebase Auth and Firestore.
export const LOCAL_DEMO = true;

export const demoUser = {
  uid: 'local-jim',
  email: 'jim@local.test',
  displayName: 'Jim',
};

export const demoProfile = {
  groupId: 'local-group',
  role: 'Admin',
  name: 'Jim',
};

export const demoMembers = [
  {
    id: demoUser.uid,
    name: 'Jim',
    displayName: 'Jim',
    email: demoUser.email,
    role: 'Admin',
  },
];

const isoDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

export const demoTasks = [
  {
    id: 'local-task-1',
    title: "Mom's cardiology follow-up",
    assignee: 'Jim',
    assigneeId: demoUser.uid,
    category: 'Appointment',
    status: 'Waiting',
    dueDate: isoDate(1),
    updates: [
      {
        type: 'note',
        text: 'Bring the medication list and insurance card.',
        timestamp: new Date(),
        user: demoUser.email,
        mentions: [],
        acknowledgedBy: [],
      },
    ],
    createdBy: demoUser.email,
    createdAt: new Date(),
    groupId: demoProfile.groupId,
  },
  {
    id: 'local-task-2',
    title: 'Grocery run',
    assignee: 'Jim',
    assigneeId: demoUser.uid,
    category: 'Household',
    status: 'In progress',
    dueDate: isoDate(0),
    updates: [],
    createdBy: demoUser.email,
    createdAt: new Date(),
    groupId: demoProfile.groupId,
  },
  {
    id: 'local-task-3',
    title: 'Refill the pill organizer',
    assignee: 'Jim',
    assigneeId: demoUser.uid,
    category: 'Misc',
    status: 'Delegated',
    dueDate: isoDate(3),
    updates: [],
    createdBy: demoUser.email,
    createdAt: new Date(),
    groupId: demoProfile.groupId,
  },
];
