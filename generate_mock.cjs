const fs = require('fs');
const path = require('path');

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randElem = (arr) => arr[randInt(0, arr.length - 1)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const USERS = [
  { id: 1, full_name: 'Phúc Trọng (Admin)', email: 'admin@domation.crm', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, full_name: 'Thế Anh (Sale 1)', email: 'sale1@domation.crm', role: 'sale', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, full_name: 'Bảo Trâm (Sale 2)', email: 'sale2@domation.crm', role: 'sale', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, full_name: 'Hoàng Huy (Sale 3)', email: 'sale3@domation.crm', role: 'sale', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: 5, full_name: 'Minh Khôi (Manager)', email: 'manager@domation.crm', role: 'manager', avatar: 'https://i.pravatar.cc/150?u=5' },
];

const SALES_IDS = [2, 3, 4];

const INDUSTRIES = ['Công nghệ & Viễn thông', 'Tài chính - Ngân hàng', 'Bán lẻ', 'Logistics', 'Bất động sản', 'F&B', 'Sản xuất', 'Y tế'];
const STAGES = [1, 2, 3, 4, 5]; // Pipeline stages
const COMPANY_PREFIXES = ['Công ty CP', 'Tập đoàn', 'Công ty TNHH', 'Doanh nghiệp', 'Chi nhánh'];
const COMPANY_NAMES = ['Hoàng Long', 'Thành Đạt', 'Việt Tín', 'Toàn Cầu', 'Đại Nam', 'Tiến Phát', 'Đông Á', 'Nam Việt', 'Thái Bình Dương', 'Sài Gòn', 'Hà Nội', 'Mekong', 'Hải Phong'];
const COMPANY_SUFFIXES = ['Group', 'Corp', 'Holdings', 'JSC', 'Investment', 'Trading', 'Tech'];

let COMPANIES = [];
for (let i = 1; i <= 40; i++) {
  let name = `${randElem(COMPANY_PREFIXES)} ${randElem(COMPANY_NAMES)} ${randElem(COMPANY_SUFFIXES)} ${i}`;
  COMPANIES.push({
    id: i,
    name,
    industry: randElem(INDUSTRIES),
    address: `Tầng ${randInt(1,20)}, Tòa nhà ${randElem(['A', 'B', 'C', 'D'])}, Hà Nội`,
    website: `https://company${i}.vn`,
    tax_id: `010${randInt(1000000, 9999999)}`,
    size: randElem(['1-50', '50-200', '200-500', '500+']),
    stage_id: randElem(STAGES),
    expected_revenue: randInt(1, 100) * 100000000,
    status: randElem(['active', 'prospect', 'churned']),
    legal_representative: `Nguyễn Văn ${String.fromCharCode(65+i%26)}`,
    logo: `https://ui-avatars.com/api/?name=${name.replace(/ /g, '+')}&background=random&color=fff&size=128`
  });
}

const FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi'];
const LAST_NAMES = ['Anh', 'Hà', 'Nam', 'Tuyết', 'Đức', 'Yến', 'Mạnh', 'Lan', 'Quang', 'Trang', 'Sơn', 'Tâm', 'Linh', 'Thành', 'Phong', 'Tuấn'];
const JOB_TITLES = ['Giám đốc', 'Trưởng phòng Mua sắm', 'Phó TGĐ', 'Quản lý Chuỗi cung ứng', 'Trưởng phòng IT', 'Kế toán trưởng', 'Giám đốc Nhân sự', 'Chuyên viên', 'Quản lý Dự án'];

let CONTACTS = [];
for (let i = 1; i <= 150; i++) {
  let company = randElem(COMPANIES);
  let owner_id = randElem(SALES_IDS);
  let status = randElem(['lead', 'qualified', 'customer', 'churned']);
  let score = randInt(10, 100);
  if (status === 'customer') score = randInt(80, 100);
  CONTACTS.push({
    id: i,
    first_name: randElem(FIRST_NAMES),
    last_name: randElem(LAST_NAMES),
    email: `contact${i}@${company.website.replace('https://', '')}`,
    phone: `09${randInt(10000000, 99999999)}`,
    company_id: company.id,
    company_name: company.name,
    job_title: randElem(JOB_TITLES),
    status,
    source: randElem(['referral', 'website', 'social', 'cold_call', 'event', 'other']),
    last_contact: randomDate(new Date(2026, 0, 1), new Date(2026, 4, 12)).toISOString().split('T')[0],
    owner_id,
    owner_name: USERS.find(u => u.id === owner_id).full_name,
    stage_id: randElem(STAGES),
    expected_revenue: randInt(1, 50) * 50000000,
    tags: [randElem(['Khách VIP', 'BĐS', 'Tech Giant', 'Potential', 'Chờ duyệt'])],
    avatar: `https://i.pravatar.cc/150?u=${i+100}`,
    lead_score: score
  });
}

const DEAL_TITLES = ['Hợp đồng ERP', 'Hệ thống Quản lý', 'Triển khai Cloud', 'Bảo trì Phần mềm', 'Giải pháp CRM', 'Mua sắm Thiết bị IT', 'Nâng cấp Server', 'Tư vấn Chuyển đổi số'];
const DEAL_STAGES = [
  { id: 'lead', name: 'Lead mới', color: '#94a3b8', prob: 10 },
  { id: 'contacted', name: 'Liên hệ', color: '#6366f1', prob: 30 },
  { id: 'proposal', name: 'Đề xuất/Báo giá', color: '#f59e0b', prob: 50 },
  { id: 'negotiation', name: 'Thương lượng', color: '#3b82f6', prob: 70 },
  { id: 'won', name: 'Đã chốt (Won)', color: '#10b981', prob: 100 },
  { id: 'lost', name: 'Thất bại (Lost)', color: '#ef4444', prob: 0 }
];

let DEALS = [];
let INVOICES = [];
for (let i = 1; i <= 80; i++) {
  let contact = randElem(CONTACTS);
  let stage = randElem(DEAL_STAGES);
  let value = randInt(5, 500) * 10000000;
  DEALS.push({
    id: i,
    title: `${randElem(DEAL_TITLES)} cho ${contact.company_name}`,
    value,
    stage: stage.id,
    contact_id: contact.id,
    company_id: contact.company_id,
    company_name: contact.company_name,
    probability: stage.prob,
    expected_close: randomDate(new Date(2026, 0, 1), new Date(2026, 11, 31)).toISOString().split('T')[0],
    owner_id: contact.owner_id,
    owner_name: contact.owner_name,
    stage_color: stage.color
  });

  if (stage.id === 'won') {
    INVOICES.push({
      id: INVOICES.length + 1,
      invoice_no: `INV-2026-${String(INVOICES.length + 1).padStart(4, '0')}`,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      owner_id: contact.owner_id, // Tie invoice to sale owner
      total: value,
      date: randomDate(new Date(2026, 0, 1), new Date(2026, 4, 1)).toISOString().split('T')[0],
      due_date: randomDate(new Date(2026, 4, 2), new Date(2026, 6, 1)).toISOString().split('T')[0],
      status: randElem(['paid', 'unpaid', 'overdue']),
      items: [{ name: `Dịch vụ cho Deal #${i}`, qty: 1, price: value }]
    });
  }
}

let ACTIVITIES = [];
for (let c of CONTACTS) {
  let numActs = randInt(1, 5);
  for (let j = 0; j < numActs; j++) {
    ACTIVITIES.push({
      id: ACTIVITIES.length + 1,
      subject: `${randElem(['Cuộc gọi tư vấn', 'Họp chốt phương án', 'Gửi báo giá', 'Demo sản phẩm', 'Email follow-up', 'Khảo sát thực địa'])} với khách hàng`,
      type: randElem(['call', 'meeting', 'email', 'task', 'note']),
      status: randElem(['planned', 'done']),
      user_id: c.owner_id,
      user_name: c.owner_name,
      due_date: randomDate(new Date(2026, 3, 1), new Date(2026, 5, 30)).toISOString(),
      contact_id: c.id,
      contact_name: c.last_name,
      body: `Nội dung chi tiết về hoạt động. Khách hàng phản hồi rất tích cực.`,
      created_at: randomDate(new Date(2026, 0, 1), new Date(2026, 4, 1)).toISOString()
    });
  }
}

let EXPENSES = [];
for (let i = 1; i <= 30; i++) {
  let user = randElem(USERS);
  EXPENSES.push({
    id: i,
    title: `Chi phí ${randElem(['Đi lại', 'Tiếp khách', 'Mua sắm thiết bị', 'Marketing', 'Quảng cáo', 'Văn phòng phẩm'])}`,
    amount: randInt(1, 50) * 1000000,
    date: randomDate(new Date(2026, 0, 1), new Date(2026, 4, 12)).toISOString().split('T')[0],
    category: randElem(['Vận hành', 'Nhân sự', 'Thiết bị', 'Vận chuyển', 'Tiếp khách', 'Marketing']),
    creator_id: user.id,
    creator_name: user.full_name,
    status: randElem(['approved', 'pending', 'rejected']),
    vendor_name: randElem(['Grab', 'Nhà hàng XYZ', 'Công ty ABC', 'Facebook Ads', 'Google Cloud']),
    has_vat_invoice: randElem([true, false]),
    is_vat_inclusive: true,
    approver_id: 1 // Admin
  });
}

let TICKETS = [];
for (let i = 1; i <= 20; i++) {
  let contact = randElem(CONTACTS);
  TICKETS.push({
    id: i,
    subject: `${randElem(['Lỗi', 'Yêu cầu hỗ trợ', 'Thắc mắc', 'Đổi trả', 'Khiếu nại'])}: Hệ thống/Dịch vụ`,
    customer_name: `${contact.first_name} ${contact.last_name}`,
    owner_id: contact.owner_id,
    priority: randElem(['low', 'medium', 'high', 'urgent']),
    status: randElem(['open', 'pending', 'closed']),
    created_at: randomDate(new Date(2026, 3, 1), new Date(2026, 4, 12)).toISOString(),
    assigned_to: randElem(USERS).full_name
  });
}

const PRODUCTS = [
  { id: 1, name: 'Hệ thống ERP Doanh nghiệp (Enterprise)', sku: 'ERP-ENT-01', category: 'Phần mềm', price: 1500000000, unit: 'hợp đồng', is_active: true, stock: 10 },
  { id: 2, name: 'Dịch vụ Cloud Infrastructure (AWS)', sku: 'CLD-AWS-INF', category: 'Cơ sở hạ tầng', price: 50000000, unit: 'tháng', is_active: true, stock: 99 },
  { id: 3, name: 'Máy chủ Dell PowerEdge R740', sku: 'HW-DELL-R740', category: 'Phần cứng', price: 125000000, unit: 'bộ', is_active: true, stock: 5 },
  { id: 4, name: 'Laptop Dell XPS 15 2026', sku: 'HW-LAP-XPS15', category: 'Thiết bị', price: 45000000, unit: 'cái', is_active: true, stock: 12 },
  { id: 5, name: 'Khóa đào tạo Quản trị CRM', sku: 'SV-TRAIN-CRM', category: 'Dịch vụ', price: 15000000, unit: 'khóa', is_active: true, stock: 50 },
];

for(let i=6; i<=15; i++) {
  PRODUCTS.push({
    id: i, name: `Sản phẩm mở rộng ${i}`, sku: `PROD-${i}`, category: randElem(['Phần mềm', 'Cơ sở hạ tầng', 'Thiết bị', 'Dịch vụ']),
    price: randInt(1, 100) * 1000000, unit: randElem(['cái', 'tháng', 'bộ', 'gói']), is_active: true, stock: randInt(10, 100)
  });
}

const BATCHES = [];
for (let i = 1; i <= 20; i++) {
  let prod = randElem(PRODUCTS);
  BATCHES.push({
    id: i, product_id: prod.id, product_name: prod.name, sku: prod.sku, category: prod.category, unit: prod.unit,
    supplier_name: `Nhà cung cấp ${randInt(1, 5)}`, batch_code: `BATCH-${2026}-${i}`, import_date: '2026-03-15',
    import_price: prod.price * 0.7, initial_qty: 50, current_qty: randInt(0, 50), status: 'active'
  });
}

const QUOTES = [];
for (let i = 1; i <= 30; i++) {
  let deal = randElem(DEALS);
  QUOTES.push({
    id: i, quote_number: `QT-2026-${String(i).padStart(3, '0')}`, title: `Báo giá cho ${deal.title}`, total: deal.value,
    status: randElem(['draft', 'sent', 'accepted', 'rejected']), valid_until: '2026-06-30', created_at: '2026-05-01',
    contact_name: CONTACTS.find(c => c.id === deal.contact_id).last_name, company_name: deal.company_name, owner_id: deal.owner_id, contact_id: deal.contact_id
  });
}

const PIPELINE_STAGES = [
  { id: 1, name: 'Lead mới', color: '#94a3b8', order_index: 0 },
  { id: 2, name: 'Liên hệ', color: '#6366f1', order_index: 1 },
  { id: 3, name: 'Demo/Meeting', color: '#3b82f6', order_index: 2 },
  { id: 4, name: 'Đề xuất/Báo giá', color: '#f59e0b', order_index: 3 },
  { id: 5, name: 'Đã chốt (Won)', color: '#10b981', order_index: 4, is_won: true },
  { id: 6, name: 'Thất bại (Lost)', color: '#ef4444', order_index: 5, is_lost: true },
];

const TAGS = [
  { id: 1, name: 'Khách VIP', color: '#7c3aed', count: 15 },
  { id: 2, name: 'Tiềm năng cao', color: '#10b981', count: 25 },
  { id: 3, name: 'Chờ thanh toán', color: '#f59e0b', count: 8 },
  { id: 4, name: 'Khiếu nại', color: '#ef4444', count: 3 },
];

const SUPPLIERS = [
  { id: 1, name: 'Dell Technologies Vietnam', contact_person: 'Nguyễn Văn A', phone: '0243123456', email: 'vna@dell.com', category: 'Phần cứng' },
  { id: 2, name: 'FPT Software', contact_person: 'Lê Thị B', phone: '0243765432', email: 'ltb@fpt.com', category: 'Phần mềm' },
];

const FILES = [];
for (let i = 1; i <= 50; i++) {
  let contact = randElem(CONTACTS);
  FILES.push({
    id: i,
    name: `${randElem(['Hợp đồng', 'Báo giá', 'Profile', 'Tài liệu kỹ thuật', 'CMND', 'GPKD'])}_${contact.company_name.replace(/\s+/g, '_')}.pdf`,
    file_size: randInt(500, 5000) * 1024,
    mime_type: 'application/pdf',
    file_path: `uploads/file${i}.pdf`,
    uploader_name: contact.owner_name,
    created_at: randomDate(new Date(2026, 0, 1), new Date(2026, 4, 12)).toISOString(),
    category: randElem(['contract', 'quote', 'legal', 'other']),
    contact_id: contact.id
  });
}
const NOTIFICATIONS = [
  { id: 1, title: 'Hóa đơn quá hạn', body: 'Có hóa đơn chưa thanh toán', type: 'error', is_read: 0, created_at: new Date().toISOString() }
];

const OUTPUT = `import { create } from 'zustand';

/**
 * MOCK DATA STORE - DEV_MODE ONLY
 * Generated via scratch script. Diversified and logically interconnected.
 */

const USERS = ${JSON.stringify(USERS, null, 2)};
const COMPANIES = ${JSON.stringify(COMPANIES, null, 2)};
const CONTACTS = ${JSON.stringify(CONTACTS, null, 2)};
const DEALS = ${JSON.stringify(DEALS, null, 2)};
const ACTIVITIES = ${JSON.stringify(ACTIVITIES, null, 2)};
const EXPENSES = ${JSON.stringify(EXPENSES, null, 2)};
const INVOICES = ${JSON.stringify(INVOICES, null, 2)};
const TICKETS = ${JSON.stringify(TICKETS, null, 2)};
const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};
const BATCHES = ${JSON.stringify(BATCHES, null, 2)};
const QUOTES = ${JSON.stringify(QUOTES, null, 2)};
const PIPELINE_STAGES = ${JSON.stringify(PIPELINE_STAGES, null, 2)};
const TAGS = ${JSON.stringify(TAGS, null, 2)};
const SUPPLIERS = ${JSON.stringify(SUPPLIERS, null, 2)};
const FILES = ${JSON.stringify(FILES, null, 2)};
const NOTIFICATIONS = ${JSON.stringify(NOTIFICATIONS, null, 2)};

export const getFilteredMockState = () => {
  const state = useMockStore.getState();
  let user = null;
  try {
    const authData = localStorage.getItem('minth-auth');
    if (authData) {
      user = JSON.parse(authData).state?.user;
    }
  } catch (e) {
    console.warn('Could not parse auth state for mock filtering', e);
  }

  if (!user || user.role === 'admin' || user.role === 'manager') return state;
  if (user.role === 'sale') {
    return {
      ...state,
      contacts: state.contacts.filter((c: any) => c.owner_id === user.id),
      deals: state.deals.filter((d: any) => d.owner_id === user.id),
      activities: state.activities.filter((a: any) => a.user_id === user.id),
      expenses: state.expenses.filter((e: any) => e.creator_id === user.id),
      invoices: state.invoices.filter((i: any) => i.owner_id === user.id),
      tickets: state.tickets.filter((t: any) => t.owner_id === user.id),
      quotes: state.quotes.filter((q: any) => q.owner_id === user.id),
    };
  }
  return state;
};

interface MockStore {
  users: any[];
  companies: any[];
  contacts: any[];
  deals: any[];
  activities: any[];
  expenses: any[];
  invoices: any[];
  tickets: any[];
  products: any[];
  batches: any[];
  notifications: any[];
  quotes: any[];
  pipeline_stages: any[];
  tags: any[];
  suppliers: any[];
  files: any[];
  addContact: (c: any) => void;
  addExpense: (e: any) => void;
  addDeal: (d: any) => void;
  addProduct: (p: any) => void;
  updateDeal: (updated: any) => void;
  updateTicket: (updated: any) => void;
  addActivity: (a: any) => void;
  setActivities: (list: any[]) => void;
  markNotificationRead: (id: number) => void;
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
  products: PRODUCTS,
  batches: BATCHES,
  notifications: NOTIFICATIONS,
  quotes: QUOTES,
  pipeline_stages: PIPELINE_STAGES,
  tags: TAGS,
  suppliers: SUPPLIERS,
  files: FILES,
  addContact: (c) => set((s) => ({ contacts: [c, ...s.contacts] })),
  addExpense: (e) => set((s) => ({ expenses: [e, ...s.expenses] })),
  addDeal: (d) => set((s) => ({ deals: [d, ...s.deals] })),
  addProduct: (p) => set((s) => ({ products: [{ ...p, id: s.products.length + 1 }, ...s.products] })),
  updateDeal: (updated) => set((s) => ({ deals: s.deals.map(d => d.id === updated.id ? updated : d) })),
  updateTicket: (updated) => set((s) => ({ tickets: s.tickets.map(t => t.id === updated.id ? updated : t) })),
  addActivity: (a) => set((s) => ({ activities: [a, ...s.activities] })),
  setActivities: (list) => set(() => ({ activities: list })),
  markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n) })),
}));
`;

fs.writeFileSync(path.join(__dirname, 'src', 'store', 'mockStore.ts'), OUTPUT, 'utf8');
console.log('Successfully generated mockStore.ts');
