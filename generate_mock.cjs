const fs = require('fs');
const path = require('path');

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randElem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const INDUSTRIES = ['Công nghệ & Viễn thông', 'Tài chính - Ngân hàng', 'Bất động sản & Xây dựng', 'Y tế & Dược phẩm', 'Bán lẻ & Thương mại điện tử', 'Sản xuất công nghiệp', 'Giáo dục & Đào tạo', 'Logistics & Vận tải', 'F&B & Chuỗi nhà hàng'];
const USERS = [
  { id: 1, full_name: "Phúc Trọng (Admin)", email: "admin@domation.crm", role: "admin", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, full_name: "Thế Anh (Sale 1)", email: "sale1@domation.crm", role: "sale", avatar: "https://i.pravatar.cc/150?u=2" },
  { id: 3, full_name: "Bảo Trâm (Sale 2)", email: "sale2@domation.crm", role: "sale", avatar: "https://i.pravatar.cc/150?u=3" },
  { id: 5, full_name: "Minh Khôi (Manager)", email: "manager@domation.crm", role: "manager", avatar: "https://i.pravatar.cc/150?u=5" }
];

const COMPANIES = [];
for (let i = 1; i <= 20; i++) {
  COMPANIES.push({
    id: i,
    name: `${randElem(['Tập đoàn', 'Tổng công ty', 'Công ty CP'])} ${randElem(['Mekong', 'Nam Việt', 'Đại Nam'])} ${i}`,
    industry: randElem(INDUSTRIES),
    address: `Đường ${i}, TP. Hồ Chí Minh`,
    tax_id: `0${randInt(100000000, 999999999)}`,
    status: 'active'
  });
}

const CONTACTS = [];
for (let i = 1; i <= 30; i++) {
  let co = randElem(COMPANIES);
  CONTACTS.push({
    id: i,
    first_name: randElem(['Nguyễn', 'Trần', 'Lê']),
    last_name: randElem(['Nam', 'Lan', 'Hải']),
    email: `contact${i}@example.com`,
    company_id: co.id,
    company_name: co.name,
    owner_id: randElem(USERS).id,
    owner_name: randElem(USERS).full_name,
    custom_fields: [
      { id: 101, label: "Sở thích", field_type: "text", value: "Đọc sách" },
      { id: 102, label: "Nguồn gốc", field_type: "dropdown", value: "Sự kiện", options: ["Sự kiện", "Website"] }
    ]
  });
}

const DEAL_STAGES = [
  { id: 'lead', name: 'Mới', color: '#3b82f6', prob: 20 },
  { id: 'won', name: 'Thành công', color: '#10b981', prob: 100 }
];

const DEALS = [];
for (let i = 1; i <= 30; i++) {
  let c = randElem(CONTACTS);
  DEALS.push({
    id: i,
    title: `Dự án ERP - ${c.company_name}`,
    value: randInt(10, 100) * 1000000,
    stage: 'lead',
    contact_id: c.id,
    company_id: c.company_id,
    owner_id: c.owner_id,
    custom_fields: [
      { id: 1, label: "Mã số thuế", field_type: "text", value: "0123456789" }
    ]
  });
}

const TICKETS = [];
const NOTIFICATIONS = [
  { id: 1, title: 'Lead mới', content: 'Có khách hàng mới từ Website', is_read: 0, created_at: new Date().toISOString() }
];

const CONTENT = `
import { create } from 'zustand';

const USERS = ${JSON.stringify(USERS, null, 2)};
const COMPANIES = ${JSON.stringify(COMPANIES, null, 2)};
const CONTACTS = ${JSON.stringify(CONTACTS, null, 2)};
const DEALS = ${JSON.stringify(DEALS, null, 2)};
const ACTIVITIES = [];
const EXPENSES = [];
const INVOICES = [];
const PRODUCTS = [];
const BATCHES = [];
const TICKETS = [];
const NOTIFICATIONS = ${JSON.stringify(NOTIFICATIONS, null, 2)};
const TAGS = [];
const PIPELINE_STAGES = ${JSON.stringify(DEAL_STAGES, null, 2)};

export const useMockStore = create((set) => ({
  users: USERS,
  companies: COMPANIES,
  contacts: CONTACTS,
  deals: DEALS,
  activities: ACTIVITIES,
  expenses: EXPENSES,
  invoices: INVOICES,
  tickets: TICKETS,
  products: PRODUCTS,
  batches: BATCHES,
  notifications: NOTIFICATIONS,
  quotes: [],
  pipeline_stages: PIPELINE_STAGES,
  tags: TAGS,
  suppliers: [],
  files: [],
  addContact: (c) => set((s) => ({ contacts: [c, ...s.contacts] })),
  addDeal: (d) => set((s) => ({ deals: [d, ...s.deals] })),
  updateDeal: (updated) => set((s) => ({ deals: s.deals.map(d => d.id === updated.id ? updated : d) })),
  markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n) })),
}));

export const getFilteredMockState = () => useMockStore.getState();
`;

fs.writeFileSync(path.join(__dirname, 'src', 'store', 'mockStore.ts'), CONTENT);
console.log('Generated mockStore.ts');
