export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'process_team' | 'supervisor' | 'support_ops' | 'agent';
  isActive: boolean;
  lastLogin?: string;
  preferences: Record<string, any>;
}

export interface Partner {
  id: number;
  name: string;
  email: string;
  contactPerson: string;
  phone?: string;
  address?: string;
  timezone: string;
  isActive: boolean;
  settings: Record<string, any>;
  Brands?: Brand[];
  Components?: Component[];
}

export interface Component {
  id: number;
  name: string;
  email: string;
  description?: string;
  languages: string[];
  isActive: boolean;
  notificationSettings: Record<string, boolean>;
  escalationRules: Record<string, any>;
  partnerId: number;
  Partner?: Partner;
  Brands?: Brand[];
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  settings: Record<string, any>;
  Partners?: Partner[];
  ProcessTickets?: ProcessTicket[];
}

export interface ProcessTicket {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'in_progress' | 'under_review' | 'approved' | 'scheduled' | 'live' | 'on_hold' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate?: string;
  publishedDate?: string;
  deadline?: string;
  tags: string[];
  attachments: any[];
  metadata: Record<string, any>;
  version: number;
  isActive: boolean;
  createdBy: number;
  assignedTo?: number;
  componentId: number;
  Component?: Component;
  CreatedBy?: User;
  AssignedTo?: User;
  Brands?: Brand[];
  Comments?: Comment[];
  StatusHistory?: StatusHistory[];
}

export interface Comment {
  id: number;
  content: string;
  isInternal: boolean;
  isResolved: boolean;
  resolvedBy?: number;
  resolvedAt?: string;
  attachments: any[];
  authorId: number;
  processTicketId: number;
  Author?: User;
}

export interface StatusHistory {
  id: number;
  previousStatus?: string;
  newStatus: string;
  reason?: string;
  metadata: Record<string, any>;
  processTicketId: number;
  changedBy: number;
  ChangedBy?: User;
}

export interface Notification {
  id: number;
  type: 'email' | 'sms' | 'in_app';
  recipient: string;
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  description?: string;
}

export interface Integration {
  id: number;
  name: string;
  type: 'document360' | 'jira' | 'slack' | 'teams' | 'custom';
  isEnabled: boolean;
  config: Record<string, any>;
  lastSync?: string;
  syncStatus: 'success' | 'failed' | 'in_progress';
  errorMessage?: string;
}

export interface DashboardData {
  overview: {
    totalTickets: number;
    ticketsThisMonth: number;
    statusBreakdown: Array<{ status: string; count: number }>;
    componentStats: Array<{ id: number; name: string; ticketCount: number }>;
    recentTickets: ProcessTicket[];
  };
}

export interface ProcessTeamDashboard {
  createdTickets: number;
  pendingApprovals: number;
  overdueItems: number;
  ticketsByStatus: Array<{ status: string; count: number }>;
}

export interface SupportOpsDashboard {
  ticketsByStatus: Array<{ status: string; count: number }>;
  partnerResponseTimes: Array<{ partnerName: string; avgResponseTime: number }>;
  upcomingDeadlines: ProcessTicket[];
}

export interface AdminDashboard {
  systemUsage: {
    totalUsers: number;
    totalPartners: number;
    totalComponents: number;
    totalBrands: number;
  };
  workflowBottlenecks: Array<{ status: string; count: number; avgAge: number }>;
  partnerEngagement: Array<{ partnerName: string; ticketCount: number; uniqueUsers: number }>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
