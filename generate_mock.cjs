const fs = require('fs');
const path = require('path');

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randElem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const INDUSTRIES = ['Công nghệ & Viễn thông', 'Tài chính - Ngân hàng', 'Bất động sản & Xây dựng', 'Y tế & Dược phẩm', 'Sản xuất & Phân phối', 'Giáo dục', 'Bán lẻ', 'Logistics'];
const USERS = [
  { id: 1, full_name: "Phúc Trọng (Admin)", email: "admin@minth.io", role: "admin", avatar_url: "https://i.pravatar.cc/150?u=1" },
  { id: 2, full_name: "Thế Anh (Sale 1)", email: "sale1@minth.io", role: "sale", avatar_url: "https://i.pravatar.cc/150?u=2" },
  { id: 3, full_name: "Bảo Trâm (Sale 2)", email: "sale2@minth.io", role: "sale", avatar_url: "https://i.pravatar.cc/150?u=3" },
  { id: 5, full_name: "Minh Khôi (Manager)", email: "manager@minth.io", role: "manager", avatar_url: "https://i.pravatar.cc/150?u=5" }
];

const COMPANY_NAMES = [
  "Tập đoàn Vingroup (Demo)", "Ngân hàng Techcombank", "Công ty CP FPT Software", "Hệ thống Y tế Vinmec", "Đại học Bách Khoa HN",
  "Công ty Xây dựng Hòa Bình", "Tổng Công ty Viettel", "Sữa Việt Nam Vinamilk", "Tập đoàn Masan", "Thế Giới Di Động",
  "Công ty CP Shopee Việt Nam", "Grab Việt Nam", "Tập đoàn Điện lực EVN", "Ngân hàng Vietcombank", "Bất động sản Novaland",
  "Dược phẩm Hậu Giang", "Tổng công ty Hàng không VNA", "Tập đoàn Hòa Phát", "Công ty CP Tiki", "Ngân hàng VPBank"
];

const PIPELINE_STAGES = [
  { id: 'lead', name: 'Lead mới', color: '#8b5cf6', prob: 10 },
  { id: 'contacted', name: 'Tiếp cận', color: '#3b82f6', prob: 30 },
  { id: 'demo', name: 'Demo/Meeting', color: '#eab308', prob: 50 },
  { id: 'proposal', name: 'Báo giá/Thương thảo', color: '#f97316', prob: 75 },
  { id: 'won', name: 'Chốt thành công', color: '#10b981', prob: 100 },
  { id: 'lost', name: 'Từ chối', color: '#ef4444', prob: 0 }
];

const COMPANIES = COMPANY_NAMES.map((name, i) => ({
  id: i + 1,
  name,
  industry: randElem(INDUSTRIES),
  address: `Số ${randInt(1, 500)} Đường ${randElem(['Lê Lợi', 'Nguyễn Huệ', 'Trần Hưng Đạo', 'Láng Hạ', 'Giải Phóng'])}, ${randElem(['Hà Nội', 'TP.HCM', 'Đà Nẵng'])}`,
  tax_id: `010${randInt(1000000, 9999999)}`,
  status: 'active',
  stage_id: randElem(PIPELINE_STAGES).id
}));

const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô'];
const FIRST_NAMES = ['Hoàng Nam', 'Quốc Hưng', 'Thị Lan Anh', 'Văn Hùng', 'Thanh Bình', 'Minh Đức', 'Thu Hà', 'Đức Kiên', 'Minh Tâm', 'Thị Mai'];

const CONTACTS = [];
for (let i = 1; i <= 40; i++) {
  const company = COMPANIES[i % COMPANIES.length];
  const owner = USERS[i % USERS.length];
  CONTACTS.push({
    id: i,
    first_name: randElem(LAST_NAMES),
    last_name: randElem(FIRST_NAMES),
    email: `contact${i}@${company.name.toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '')}.com`,
    phone: `09${randInt(10000000, 99999999)}`,
    job_title: randElem(['Giám đốc', 'Trưởng phòng IT', 'Procurement Manager', 'CEO', 'CFO', 'Technical Lead']),
    department: randElem(['Khối Công nghệ', 'IT', 'Mua sắm', 'Ban Giám đốc', 'Tài chính']),
    birthday: randomDate(new Date(1970, 0, 1), new Date(1995, 11, 31)).toISOString().split('T')[0],
    source: randElem(['website', 'referral', 'event', 'direct']),
    expected_revenue: randInt(5, 500) * 10000000,
    company_id: company.id,
    company_name: company.name,
    owner_id: owner.id,
    owner_name: owner.full_name,
    stage_id: randElem(PIPELINE_STAGES).id,
    tags: [randElem(['VIP', 'Decision Maker', 'Tech', 'Healthcare', 'Banking', 'Education'])]
  });
}

const DEALS = [];
const ACTIVITIES = [];
const QUOTES = [];
const INVOICES = [];
const FILES = [];
const TICKETS = [];

const ACTIVITY_TEMPLATES = [
  { subject: "Gọi tư vấn báo giá hạ tầng", type: "call", body: "Khách hàng quan tâm tới giải pháp Cloud, cần báo giá chi tiết cấu hình 4 node. Yêu cầu bàn giao trong tháng 6.", metadata: { duration: '5:42', recording_url: 'https://cdn.samplelib.com/mp3/sample-3s.mp3' } },
  { subject: "Gửi tài liệu kỹ thuật & Datasheet", type: "email", body: "Đã gửi bản vẽ sơ đồ mạng và tài liệu datasheet thiết bị Cisco. Chờ khách hàng phản hồi về phần firewall.", metadata: { opens: 3, last_open: new Date().toISOString() } },
  { subject: "Họp khảo sát hiện trạng phòng máy", type: "meeting", body: "Đã tới site khảo sát phòng máy. Cần lưu ý phần điện dự phòng và điều hòa. Khách yêu cầu khảo sát thêm đợt 2.", metadata: { zoom_link: 'https://zoom.us/j/123456789', participants: ['Nguyễn Văn Hùng', 'Phúc Trọng', 'Minh Khôi'] } },
  { subject: "Thương thảo hợp đồng & Chiết khấu", type: "call", body: "Khách đề nghị chiết khấu thêm 5%. Đang trình sếp duyệt phương án tặng kèm gói bảo trì 6 tháng.", metadata: { duration: '12:15' } }
];

CONTACTS.forEach((contact, idx) => {
  const numDeals = randInt(1, 2);
  for (let d = 0; d < numDeals; d++) {
    const dealId = DEALS.length + 1;
    const stage = randElem(PIPELINE_STAGES);
    const deal = {
      id: dealId,
      title: `Dự án ${randElem(['Cloud', 'Hardware', 'Network', 'Software', 'Security'])} - ${contact.company_name}`,
      value: randInt(50, 1500) * 1000000,
      stage_id: stage.id,
      stage: stage.name,
      probability: stage.prob,
      expected_close: new Date(Date.now() + 60 * 86400000).toISOString(),
      contact_id: contact.id,
      company_id: contact.company_id,
      owner_id: contact.owner_id,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    };
    DEALS.push(deal);

    // 2. Activities & Tasks for this deal
    for (let i = 0; i < 3; i++) {
      const template = ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length];
      ACTIVITIES.push({
        id: ACTIVITIES.length + 1,
        subject: template.subject,
        type: template.type,
        status: 'done',
        priority: 'medium',
        contact_id: contact.id,
        contact_name: `${contact.last_name} ${contact.first_name}`,
        deal_id: deal.id,
        deal_name: deal.title,
        body: template.body,
        notes: template.body,
        user_name: USERS[idx % USERS.length].full_name,
        owner_id: USERS[idx % USERS.length].id,
        created_at: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
        due_date: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
        color: template.type === 'call' ? '#3b82f6' : template.type === 'email' ? '#8b5cf6' : '#eab308',
        metadata: template.metadata || {},
        related_type: 'deal',
        related_id: deal.id
      });
    }

    // Task
    ACTIVITIES.push({
      id: ACTIVITIES.length + 1,
      subject: `Theo dõi tiến độ deal: ${deal.title}`,
      type: "task",
      status: "planned",
      priority: randElem(['low', 'medium', 'high']),
      contact_id: contact.id,
      contact_name: `${contact.last_name} ${contact.first_name}`,
      deal_id: deal.id,
      deal_name: deal.title,
      due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      user_name: USERS[idx % USERS.length].full_name,
      owner_id: USERS[idx % USERS.length].id,
      created_at: new Date().toISOString(),
      related_type: 'deal',
      related_id: deal.id
    });

    // Quote
    if (stage.prob >= 50) {
      const quoteId = QUOTES.length + 1;
      const quote = {
        id: quoteId,
        quote_number: `Q-2024-${String(quoteId).padStart(3, '0')}`,
        title: `Báo giá cho ${deal.title}`,
        contact_id: contact.id,
        company_id: contact.company_id,
        deal_id: deal.id,
        subtotal: deal.value * 0.9,
        tax: deal.value * 0.1,
        total: deal.value,
        status: stage.id === 'won' ? "approved" : "sent",
        created_at: deal.created_at,
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      };
      QUOTES.push(quote);

      if (quote.status === 'approved') {
        const invoiceId = INVOICES.length + 1;
        INVOICES.push({
          id: invoiceId,
          invoice_number: `INV-2024-${String(invoiceId).padStart(3, '0')}`,
          title: `Hóa đơn cho ${quote.title}`,
          quote_id: quote.id,
          contact_id: contact.id,
          company_id: contact.company_id,
          total: quote.total,
          status: randElem(['paid', 'pending']),
          created_at: quote.created_at,
          due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
        });
      }
    }
  }

  // Files
  const extensions = ['pdf', 'docx', 'xlsx', 'jpg', 'zip'];
  extensions.forEach((ext, i) => {
    FILES.push({
      id: FILES.length + 1,
      name: `Tai_lieu_${i+1}_${contact.company_name.replace(/\s+/g, '_')}.${ext}`,
      size: randInt(1, 20) * 1024000,
      file_size: randInt(1, 20) * 1024000,
      category: randElem(['contract', 'document', 'technical']),
      contact_id: contact.id,
      company_id: contact.company_id,
      created_at: new Date(Date.now() - (i + 5) * 86400000).toISOString(),
      uploader_name: randElem(USERS).full_name,
      mime_type: ext === 'pdf' ? 'application/pdf' : 'application/octet-stream',
      file_path: "#"
    });
  });

  // Ticket
  TICKETS.push({
    id: TICKETS.length + 1,
    subject: `Yêu cầu hỗ trợ triển khai - ${contact.last_name}`,
    contact_id: contact.id,
    company_id: contact.company_id,
    priority: randElem(['medium', 'high']),
    status: randElem(['open', 'in_progress']),
    category: "Implementation",
    description: "Cần hỗ trợ cấu hình hệ thống tại site khách hàng.",
    created_at: new Date().toISOString()
  });

  // Notes
  ACTIVITIES.push({
    id: ACTIVITIES.length + 1,
    subject: "Ghi chú nội bộ",
    type: "note",
    status: 'planned',
    contact_id: contact.id,
    contact_name: `${contact.last_name} ${contact.first_name}`,
    body: `Cần đặc biệt lưu ý khách hàng này. @Thế_Anh cập nhật trạng thái thường xuyên nhé.`,
    user_name: USERS[idx % USERS.length].full_name,
    owner_id: USERS[idx % USERS.length].id,
    created_at: new Date().toISOString()
  });
});

const PRODUCTS = [
  { id: 1, name: "Server Dell PowerEdge R750", sku: "DELL-R750", category: "Hardware", price: 185000000, unit: "Cái" },
  { id: 2, name: "Switch Cisco Catalyst 9300", sku: "CISCO-C9300", category: "Network", price: 95000000, unit: "Cái" },
  { id: 3, name: "WiFi 6 Access Point Aruba 535", sku: "ARUBA-535", category: "Network", price: 22000000, unit: "Cái" },
  { id: 4, name: "License Microsoft Server 2022", sku: "MS-WS-2022", category: "Software", price: 45000000, unit: "License" },
  { id: 5, name: "Storage SAN Dell Unity 380", sku: "DELL-UNITY-380", category: "Hardware", price: 1200000000, unit: "Bộ" },
  { id: 6, name: "FortiGate 100F Firewall", sku: "FG-100F", category: "Security", price: 115000000, unit: "Cái" },
  { id: 7, name: "HP EliteBook 840 G10", sku: "HP-EB-840", category: "Hardware", price: 32000000, unit: "Cái" },
  { id: 8, name: "Office 365 Business Premium", sku: "MS-O365-BP", category: "Software", price: 450000, unit: "User/Month" },
  { id: 9, name: "Logitech Rally Plus System", sku: "LOGI-RALLY", category: "AV", price: 85000000, unit: "Bộ" },
  { id: 10, name: "Veeam Backup & Replication", sku: "VEEAM-B-R", category: "Software", price: 25000000, unit: "License" },
];

const BATCHES = [];
for (let i = 1; i <= 30; i++) {
  const p = randElem(PRODUCTS);
  BATCHES.push({
    id: i,
    product_id: p.id,
    product_name: p.name,
    sku: p.sku,
    unit: p.unit,
    batch_code: `LOT-${p.sku}-${randElem(['MAY24', 'JUN24', 'JUL24'])}`,
    import_date: randomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
    import_price: p.price * 0.85,
    initial_qty: randInt(50, 200),
    current_qty: randInt(5, 50),
    status: "active"
  });
}

const INVENTORY_LOGS = BATCHES.flatMap((b, idx) => ([
  {
    id: idx * 2 + 1,
    batch_id: b.id,
    product_name: b.product_name,
    batch_code: b.batch_code,
    action_type: "IMPORT",
    qty_change: b.initial_qty,
    reason: "Nhập hàng định kỳ",
    creator_name: "Phúc Trọng",
    created_at: b.import_date
  },
  {
    id: idx * 2 + 2,
    batch_id: b.id,
    product_name: b.product_name,
    batch_code: b.batch_code,
    action_type: "SALE",
    qty_change: -(b.initial_qty - b.current_qty),
    reason: "Xuất bán dự án",
    creator_name: randElem(USERS).full_name,
    created_at: new Date().toISOString()
  }
]));

const SUPPLIERS = [
  { id: 1, name: "Tập đoàn FPT Trading", contact_name: "Nguyễn Văn Hùng", phone: "0243.7654.321", email: "hungnv@fpt.com", address: "Duy Tân, Cầu Giấy, Hà Nội" },
  { id: 2, name: "Công ty TNHH Dell EMC Việt Nam", contact_name: "Minh Đức", phone: "0901.234.567", email: "duc@dell.com", address: "Lotte Center, Hà Nội" },
  { id: 3, name: "Cisco Systems Vietnam", contact_name: "Thanh Bình", phone: "0987.654.321", email: "binh@cisco.com", address: "Diamond Plaza, TP.HCM" },
  { id: 4, name: "Công ty CP Sao Bắc Đẩu", contact_name: "Thu Hà", phone: "0243.9999.888", email: "ha@saobacdau.vn", address: "Trần Hưng Đạo, Hà Nội" },
  { id: 5, name: "Công ty CP Dịch vụ Công nghệ CMC", contact_name: "Đức Kiên", phone: "0243.8888.777", email: "kien@cmc.com", address: "CMC Tower, Duy Tân, Hà Nội" },
  { id: 6, name: "Microsoft Vietnam", contact_name: "Minh Tâm", phone: "0909.111.222", email: "tam@microsoft.com", address: "Keangnam Landmark, Hà Nội" },
  { id: 7, name: "Công ty CP Đầu tư Thế Giới Số (Digiworld)", contact_name: "Hoàng Nam", phone: "0283.888.666", email: "nam@dgw.com.vn", address: "Nam Kỳ Khởi Nghĩa, TP.HCM" },
  { id: 8, name: "Công ty CP Phân phối Synnex FPT", contact_name: "Quốc Hưng", phone: "0243.555.444", email: "hung@synnexfpt.com", address: "FPT Tower, Hà Nội" },
];

const CONTENT = `
import { create } from 'zustand';

export const useMockStore = create<any>()((set) => ({
  users: ${JSON.stringify(USERS, null, 2)},
  companies: ${JSON.stringify(COMPANIES, null, 2)},
  contacts: ${JSON.stringify(CONTACTS, null, 2)},
  deals: ${JSON.stringify(DEALS, null, 2)},
  activities: ${JSON.stringify(ACTIVITIES, null, 2)},
  expenses: [
    { id: 1, title: "Lương nhân viên tháng 5", amount: 450000000, category: "Payroll", created_at: "2024-05-30" },
    { id: 2, title: "Thuê văn phòng Keangnam", amount: 120000000, category: "Rent", created_at: "2024-05-01" },
    { id: 3, title: "Marketing Campaign Q2", amount: 250000000, category: "Marketing", created_at: "2024-05-10" },
    { id: 4, title: "Chi phí hạ tầng Cloud", amount: 85000000, category: "IT", created_at: "2024-05-15" }
  ],
  invoices: ${JSON.stringify(INVOICES, null, 2)},
  tickets: ${JSON.stringify(TICKETS, null, 2)},
  products: ${JSON.stringify(PRODUCTS, null, 2)},
  batches: ${JSON.stringify(BATCHES, null, 2)},
  inventory_logs: ${JSON.stringify(INVENTORY_LOGS, null, 2)},
  notifications: [
    { id: 1, title: 'Báo giá đã được duyệt', content: 'Khách hàng Techcombank đã duyệt báo giá hạ tầng Cloud.', is_read: 0, created_at: new Date().toISOString() }
  ],
  quotes: ${JSON.stringify(QUOTES, null, 2)},
  pipeline_stages: ${JSON.stringify(PIPELINE_STAGES, null, 2)},
  tags: [
    { id: 1, name: "VIP", color: "#f59e0b", count: 12 },
    { id: 2, name: "Banking", color: "#3b82f6", count: 8 },
    { id: 3, name: "Education", color: "#10b981", count: 5 }
  ],
  suppliers: ${JSON.stringify(SUPPLIERS, null, 2)},
  files: ${JSON.stringify(FILES, null, 2)},
}));

export const getFilteredMockState = () => useMockStore.getState();
`;

fs.writeFileSync(path.join(__dirname, 'src', 'store', 'mockStore.ts'), CONTENT);
console.log('Generated ULTRA-VIVID mockStore.ts (every contact is fully loaded).');
