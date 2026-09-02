import { Employee } from '../types';

export const initialEmployees: Employee[] = [
  {
    id: 'emp-01',
    name: 'Dr. Sameer Mehta',
    email: 'sameer.mehta@apexpharma.com',
    phone: '9820199881',
    role: 'Admin',
    status: 'Active',
    lastActive: 'Just now',
    joinedDate: '2022-01-15',
    permissions: [
      'view_pos',
      'create_sale',
      'refund_sale',
      'view_inventory',
      'adjust_inventory',
      'manage_medicines',
      'manage_purchases',
      'view_reports',
      'manage_employees',
      'manage_settings'
    ]
  },
  {
    id: 'emp-02',
    name: 'Priya Sharma',
    email: 'priya.sharma@apexpharma.com',
    phone: '9845122334',
    role: 'Chief Pharmacist',
    status: 'Active',
    lastActive: '5 mins ago',
    joinedDate: '2023-03-01',
    permissions: [
      'view_pos',
      'create_sale',
      'refund_sale',
      'view_inventory',
      'adjust_inventory',
      'manage_medicines',
      'manage_purchases',
      'view_reports'
    ]
  },
  {
    id: 'emp-03',
    name: 'Rohan Verma',
    email: 'rohan.verma@apexpharma.com',
    phone: '9811445566',
    role: 'Cashier',
    status: 'Active',
    lastActive: '12 mins ago',
    joinedDate: '2024-06-10',
    permissions: [
      'view_pos',
      'create_sale',
      'view_inventory'
    ]
  },
  {
    id: 'emp-04',
    name: 'Kavita Joshi',
    email: 'kavita.j@apexpharma.com',
    phone: '9877112233',
    role: 'Inventory Specialist',
    status: 'On Leave',
    lastActive: 'Yesterday',
    joinedDate: '2023-11-20',
    permissions: [
      'view_inventory',
      'adjust_inventory',
      'manage_medicines',
      'manage_purchases'
    ]
  }
];
