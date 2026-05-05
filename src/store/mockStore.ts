import { create } from 'zustand';

/**
 * MOCK DATA STORE - DEV_MODE ONLY
 * Cung cấp dữ liệu mẫu phong phú để demo UI/UX mà không cần backend.
 */

const USERS = [
  { id: 1, full_name: 'Quản trị viên', email: 'admin@minth.io', role: 'admin' },
  { id: 2, full_name: 'Nhân viên Kinh doanh', email: 'sale@minth.io', role: 'sale' },
  { id: 3, full_name: 'Quản lý Bán hàng', email: 'manager@minth.io', role: 'manager' },
];

const COMPANIES = [
  { id: 1, name: 'Công ty Cổ phần Công nghệ ABC', industry: 'Công nghệ', address: 'Quận 1, TP.HCM', website: 'https://abc-tech.com' },
  { id: 2, name: 'Tập đoàn Bán lẻ VinGroup', industry: 'Bán lẻ', address: 'Long Biên, Hà Nội', website: 'https://vingroup.net' },
  { id: 3, name: 'Ngân hàng TMCP Vietcombank', industry: 'Tài chính', address: 'Hoàn Kiếm, Hà Nội', website: 'https://vietcombank.com.vn' },
  { id: 4, name: 'Công ty TNHH Giải pháp Phần mềm Minth', industry: 'SaaS', address: 'Bình Thạnh, TP.HCM', website: 'https://minth.io' },
  { id: 5, name: 'Tập đoàn Sữa Việt Nam (Vinamilk)', industry: 'F&B', address: 'Quận 7, TP.HCM', website: 'https://vinamilk.com.vn' },
  { id: 6, name: 'Hãng hàng không Vietjet Air', industry: 'Hàng không', address: 'Tân Bình, TP.HCM', website: 'https://vietjetair.com' },
];

const CONTACTS = [
  { id: 1, first_name: 'Nguyễn', last_name: 'Văn An', email: 'an.nv@gmail.com', phone: '0901234567', company_id: 1, company_name: 'ABC Tech', job_title: 'Giám đốc IT', status: 'customer', source: 'referral', last_contact: '2026-05-04', owner_id: 2 },
  { id: 2, first_name: 'Trần', last_name: 'Thị Bình', email: 'binh.tt@outlook.com', phone: '0987654321', company_id: 2, company_name: 'VinGroup', job_title: 'Trưởng phòng Mua hàng', status: 'qualified', source: 'website', last_contact: '2026-05-01', owner_id: 1 },
  { id: 3, first_name: 'Lê', last_name: 'Minh Cường', email: 'cuong.lm@vinabiz.vn', phone: '0911223344', company_id: 3, company_name: 'Vietcombank', job_title: 'CEO', status: 'lead', source: 'cold_call', last_contact: '2026-04-20', owner_id: 3 },
  { id: 4, first_name: 'Phạm', last_name: 'Hồng Đào', email: 'dao.ph@hitech.vn', phone: '0933445566', company_id: 4, company_name: 'Minth SaaS', job_title: 'Quản lý dự án', status: 'customer', source: 'social', last_contact: '2026-05-05', owner_id: 2 },
  { id: 5, first_name: 'Hoàng', last_name: 'Gia Bảo', email: 'bao.hg@gmail.com', phone: '0966778899', company_id: 5, company_name: 'Vinamilk', job_title: 'CTO', status: 'qualified', source: 'event', last_contact: '2026-04-30', owner_id: 1 },
  { id: 6, first_name: 'Đặng', last_name: 'Văn Hải', email: 'hai.dv@vietjet.com', phone: '0944556677', company_id: 6, company_name: 'Vietjet Air', job_title: 'Phó giám đốc', status: 'customer', source: 'other', last_contact: '2026-05-02', owner_id: 2 },
];

const DEALS = [
  { id: 1, title: 'Triển khai CRM toàn diện', value: 2500000000, stage: 'proposal', contact_id: 1, company_id: 1, probability: 60, expected_close: '2026-06-30', owner_id: 2 },
  { id: 2, title: 'Số hóa quản lý kho', value: 850000000, stage: 'lead', contact_id: 2, company_id: 2, probability: 20, expected_close: '2026-07-15', owner_id: 1 },
  { id: 3, title: 'Nâng cấp ERP module Tài chính', value: 450000000, stage: 'negotiation', contact_id: 3, company_id: 3, probability: 75, expected_close: '2026-05-20', owner_id: 3 },
  { id: 4, title: 'Gia hạn bảo trì hệ thống', value: 120000000, stage: 'won', contact_id: 4, company_id: 4, probability: 100, expected_close: '2026-05-30', owner_id: 2 },
  { id: 5, title: 'Cung cấp License 50 users', value: 300000000, stage: 'proposal', contact_id: 5, company_id: 5, probability: 50, expected_close: '2026-06-15', owner_id: 1 },
];

const ACTIVITIES = [
  { id: 1, subject: 'Gặp mặt chốt hợp đồng dự án CRM', type: 'meeting', status: 'pending', user_name: 'Admin Sales', created_at: '2026-05-07T10:00:00Z', contact_id: 1 },
  { id: 2, subject: 'Gọi điện báo giá module Kho', type: 'call', status: 'done', user_name: 'Sale A', created_at: '2026-05-05T09:30:00Z', contact_id: 2 },
  { id: 3, subject: 'Email follow-up sau buổi demo', type: 'email', status: 'done', user_name: 'Quản trị viên', created_at: '2026-05-04T15:00:00Z', contact_id: 3 },
  { id: 4, subject: 'Gửi thiệp chúc mừng khai trương', type: 'note', status: 'done', user_name: 'Sale A', created_at: '2026-05-03T08:00:00Z', contact_id: 4 },
];

const EXPENSES = [
  { id: 1, title: 'Thuê văn phòng tháng 5', amount: 15000000, date: '2026-05-01', category: 'Vận hành', creator_name: 'Admin', status: 'approved', vendor_name: 'Minh House', has_vat_invoice: true, is_vat_inclusive: true, approver_id: 1 },
  { id: 2, title: 'Chạy quảng cáo Facebook Ads T5', amount: 25000000, date: '2026-05-02', category: 'Marketing', creator_name: 'Marketing Dept', status: 'approved', vendor_name: 'Facebook Ireland', has_vat_invoice: false, is_vat_inclusive: true, approver_id: 1 },
  { id: 3, title: 'Tiền điện nước T4', amount: 3450000, date: '2026-05-04', category: 'Vận hành', creator_name: 'Kế toán', status: 'pending', vendor_name: 'EVN/VWA', has_vat_invoice: true, is_vat_inclusive: true, approver_id: 1 },
];

const INVOICES = [
  { id: 1, invoice_no: 'INV-0001', contact_id: 1, total: 2500000000, date: '2026-04-15', due_date: '2026-05-15', status: 'unpaid' },
  { id: 2, invoice_no: 'INV-0002', contact_id: 4, total: 120000000, date: '2026-05-01', due_date: '2026-05-10', status: 'paid' },
];

const TICKETS = [
  { id: 1, subject: 'Lỗi không đăng nhập được mobile', customer_name: 'Nguyễn Văn An', priority: 'high', status: 'open', created_at: '2026-05-05T10:00:00Z' },
  { id: 2, subject: 'Yêu cầu xuất hóa đơn đỏ', customer_name: 'Trần Thị Bình', priority: 'medium', status: 'pending', created_at: '2026-05-04T14:20:00Z' },
  { id: 3, subject: 'Tư vấn gói ERP mở rộng', customer_name: 'Phạm Hồng Đào', priority: 'low', status: 'closed', created_at: '2026-05-01T09:00:00Z' },
];

interface MockStore {
  users: any[];
  companies: any[];
  contacts: any[];
  deals: any[];
  activities: any[];
  expenses: any[];
  invoices: any[];
  tickets: any[];
  addContact: (c: any) => void;
  addExpense: (e: any) => void;
  addDeal: (d: any) => void;
  updateDeal: (d: any) => void;
  updateTicket: (t: any) => void;
  addActivity: (a: any) => void;
  setActivities: (list: any[]) => void;
}

export const useMockStore = create<MockStore>((set) => ({
  users: USERS,
  companies: COMPANIES,
  contacts: CONTACTS,
  deals: DEALS,
  activities: ACTIVITIES,
  expenses: EXPENSES,
  invoices: INVOICES,
  tickets: TICKETS,
  addContact: (c) => set((s) => ({ contacts: [c, ...s.contacts] })),
  addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),
  addDeal: (d) => set((s) => ({ deals: [d, ...s.deals] })),
  updateDeal: (updated) => set((s) => ({ deals: s.deals.map(d => d.id === updated.id ? updated : d) })),
  updateTicket: (updated) => set((s) => ({ tickets: s.tickets.map(t => t.id === updated.id ? updated : t) })),
  addActivity: (a) => set((s) => ({ activities: [a, ...s.activities] })),
  setActivities: (list) => set(() => ({ activities: list })),
}));
