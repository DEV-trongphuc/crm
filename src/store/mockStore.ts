
import { create } from 'zustand';

const USERS = [
  {
    "id": 1,
    "full_name": "Phúc Trọng (Admin)",
    "email": "admin@domation.crm",
    "role": "admin",
    "avatar": "https://i.pravatar.cc/150?u=1"
  },
  {
    "id": 2,
    "full_name": "Thế Anh (Sale 1)",
    "email": "sale1@domation.crm",
    "role": "sale",
    "avatar": "https://i.pravatar.cc/150?u=2"
  },
  {
    "id": 3,
    "full_name": "Bảo Trâm (Sale 2)",
    "email": "sale2@domation.crm",
    "role": "sale",
    "avatar": "https://i.pravatar.cc/150?u=3"
  },
  {
    "id": 5,
    "full_name": "Minh Khôi (Manager)",
    "email": "manager@domation.crm",
    "role": "manager",
    "avatar": "https://i.pravatar.cc/150?u=5"
  }
];
const COMPANIES = [
  {
    "id": 1,
    "name": "Tập đoàn Công nghệ Viễn thông Tiến Phát",
    "industry": "Công nghệ & Viễn thông",
    "address": "Tòa nhà Tiến Phát, Quận 1, TP.HCM",
    "tax_id": "0312345678",
    "status": "active",
    "stage_id": "won"
  },
  {
    "id": 2,
    "name": "Ngân hàng TMCP Thịnh Vượng",
    "industry": "Tài chính - Ngân hàng",
    "address": "Số 9 Lê Duẩn, Quận 1, TP.HCM",
    "tax_id": "0300123456",
    "status": "active",
    "stage_id": "contacted"
  },
  {
    "id": 3,
    "name": "Công ty CP Xây dựng Hòa Bình Mới",
    "industry": "Bất động sản & Xây dựng",
    "address": "235 Đồng Khởi, Quận 1, TP.HCM",
    "tax_id": "0309876543",
    "status": "active",
    "stage_id": "demo"
  },
  {
    "id": 4,
    "name": "Hệ thống Y tế Sức Khỏe Vàng",
    "industry": "Y tế & Dược phẩm",
    "address": "123 Pasteur, Quận 3, TP.HCM",
    "tax_id": "0305556667",
    "status": "active",
    "stage_id": "proposal"
  }
];
const CONTACTS = [
  {
    "id": 1,
    "first_name": "Lê",
    "last_name": "Hoàng Tuấn",
    "email": "tuan.le@tienphat.vn",
    "phone": "0903123456",
    "mobile": "0912345678",
    "job_title": "Giám đốc CNTT",
    "department": "Khối Công nghệ",
    "birthday": "1985-04-12",
    "source": "website",
    "expected_revenue": 500000000,
    "company_id": 1,
    "company_name": "Tập đoàn Công nghệ Viễn thông Tiến Phát",
    "owner_id": 2,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [],
    "stage_id": "lead",
    "tags": [
      "VIP",
      "Tech"
    ]
  },
  {
    "id": 2,
    "first_name": "Trần",
    "last_name": "Minh Tâm",
    "email": "tam.tran@thinhvuong.bank",
    "phone": "0988765432",
    "mobile": "",
    "job_title": "Trưởng phòng Mua sắm",
    "department": "Hành chính Quản trị",
    "birthday": "1990-08-22",
    "source": "referral",
    "expected_revenue": 1200000000,
    "company_id": 2,
    "company_name": "Ngân hàng TMCP Thịnh Vượng",
    "owner_id": 3,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [],
    "stage_id": "demo",
    "tags": [
      "Banking"
    ]
  },
  {
    "id": 3,
    "first_name": "Phạm",
    "last_name": "Thị Lan Anh",
    "email": "lananh.pham@hoabinh.vn",
    "phone": "0933456789",
    "mobile": "0966778899",
    "job_title": "CEO",
    "department": "Ban Giám Đốc",
    "birthday": "1982-11-05",
    "source": "event",
    "expected_revenue": 80000000,
    "company_id": 3,
    "company_name": "Công ty CP Xây dựng Hòa Bình Mới",
    "owner_id": 2,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [],
    "stage_id": "proposal",
    "tags": [
      "Decision Maker"
    ]
  },
  {
    "id": 4,
    "first_name": "Nguyễn",
    "last_name": "Văn Hùng",
    "email": "hung.nguyen@suckhoevang.com",
    "phone": "0977112233",
    "mobile": "",
    "job_title": "Trưởng khoa IT",
    "department": "CNTT",
    "birthday": "1988-01-15",
    "source": "website",
    "expected_revenue": 300000000,
    "company_id": 4,
    "company_name": "Hệ thống Y tế Sức Khỏe Vàng",
    "owner_id": 3,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [],
    "stage_id": "won",
    "tags": [
      "Healthcare",
      "VIP"
    ]
  },
  {
    "id": 5,
    "first_name": "Vũ",
    "last_name": "Đức Kiên",
    "email": "kien.vu@tienphat.vn",
    "phone": "0909988776",
    "mobile": "0944556677",
    "job_title": "Phó Giám đốc",
    "department": "Khối Vận hành",
    "birthday": "1986-09-30",
    "source": "referral",
    "expected_revenue": 450000000,
    "company_id": 1,
    "company_name": "Tập đoàn Công nghệ Viễn thông Tiến Phát",
    "owner_id": 1,
    "owner_name": "Phúc Trọng (Admin)",
    "custom_fields": [],
    "stage_id": "contacted",
    "tags": []
  }
];
const DEALS = [
  {
    "id": 1,
    "title": "Triển khai hệ thống Cloud Server",
    "value": 150000000,
    "stage_id": "lead",
    "contact_id": 1,
    "company_id": 1,
    "owner_id": 2,
    "created_at": "2026-05-10T12:14:11.355Z"
  },
  {
    "id": 2,
    "title": "Cung cấp thiết bị mạng Core Switch",
    "value": 320000000,
    "stage_id": "contacted",
    "contact_id": 5,
    "company_id": 1,
    "owner_id": 1,
    "created_at": "2026-05-07T12:14:11.356Z"
  },
  {
    "id": 3,
    "title": "Giải pháp bảo mật thanh toán",
    "value": 850000000,
    "stage_id": "demo",
    "contact_id": 2,
    "company_id": 2,
    "owner_id": 3,
    "created_at": "2026-05-02T12:14:11.356Z"
  },
  {
    "id": 4,
    "title": "Bảo trì phần mềm quản lý ERP",
    "value": 45000000,
    "stage_id": "proposal",
    "contact_id": 3,
    "company_id": 3,
    "owner_id": 2,
    "created_at": "2026-04-27T12:14:11.356Z"
  },
  {
    "id": 5,
    "title": "Cung cấp máy chủ lưu trữ y tế",
    "value": 520000000,
    "stage_id": "won",
    "contact_id": 4,
    "company_id": 4,
    "owner_id": 3,
    "created_at": "2026-04-22T12:14:11.356Z"
  },
  {
    "id": 6,
    "title": "Nâng cấp đường truyền mạng bệnh viện",
    "value": 120000000,
    "stage_id": "proposal",
    "contact_id": 4,
    "company_id": 4,
    "owner_id": 3,
    "created_at": "2026-05-05T12:14:11.356Z"
  },
  {
    "id": 7,
    "title": "Hệ thống tổng đài ảo CSKH",
    "value": 68000000,
    "stage_id": "contacted",
    "contact_id": 2,
    "company_id": 2,
    "owner_id": 3,
    "created_at": "2026-05-11T12:14:11.356Z"
  }
];
const ACTIVITIES = [
  {
    "id": 1,
    "subject": "Gửi báo giá hệ thống Cloud",
    "type": "email",
    "contact_id": 1,
    "deal_id": 1,
    "body": "Đã gửi báo giá chi tiết gồm chi phí server và license. Khách hàng hẹn chiều mai phản hồi.",
    "user_name": "Thế Anh (Sale 1)",
    "owner_id": 2,
    "created_at": "2026-05-12T10:14:11.356Z"
  },
  {
    "id": 2,
    "subject": "Gọi tư vấn bảo mật thanh toán",
    "type": "call",
    "contact_id": 2,
    "deal_id": 3,
    "body": "Khách hàng rất quan tâm tới tiêu chuẩn PCI-DSS. Đã hẹn lịch demo vào tuần sau.",
    "user_name": "Bảo Trâm (Sale 2)",
    "owner_id": 3,
    "created_at": "2026-05-11T12:14:11.356Z"
  },
  {
    "id": 3,
    "subject": "Khảo sát hạ tầng mạng",
    "type": "meeting",
    "contact_id": 5,
    "deal_id": 2,
    "body": "Đã tới datacenter kiểm tra vị trí lắp đặt Core Switch. Cần cáp quang loại single-mode.",
    "user_name": "Phúc Trọng (Admin)",
    "owner_id": 1,
    "created_at": "2026-05-10T12:14:11.356Z"
  },
  {
    "id": 4,
    "subject": "Demo giải pháp lưu trữ hình ảnh y tế",
    "type": "meeting",
    "contact_id": 4,
    "deal_id": 5,
    "body": "Demo thành công. Bác sĩ trưởng khoa đánh giá cao tốc độ truy xuất.",
    "user_name": "Bảo Trâm (Sale 2)",
    "owner_id": 3,
    "created_at": "2026-05-09T12:14:11.356Z"
  }
];
const EXPENSES: any[] = [];
const INVOICES: any[] = [];
const PRODUCTS = [
  {
    "id": 1,
    "name": "Dell PowerEdge R750",
    "sku": "DELL-R750",
    "category": "Hardware",
    "price": 125000000
  },
  {
    "id": 2,
    "name": "Cisco Catalyst 9300",
    "sku": "CISCO-C9300",
    "category": "Hardware",
    "price": 85000000
  },
  {
    "id": 3,
    "name": "License Windows Server 2022",
    "sku": "MS-WS2022",
    "category": "Software",
    "price": 25000000
  }
];
const BATCHES = [
  {
    "id": 1,
    "product_id": 1,
    "product_name": "Dell PowerEdge R750",
    "sku": "DELL-R750",
    "unit": "Máy",
    "batch_code": "BATCH-DELL-26A",
    "import_date": "2026-05-01",
    "expiry_date": null,
    "import_price": 105000000,
    "initial_qty": 10,
    "current_qty": 4,
    "status": "active"
  },
  {
    "id": 2,
    "product_id": 2,
    "product_name": "Cisco Catalyst 9300",
    "sku": "CISCO-C9300",
    "unit": "Thiết bị",
    "batch_code": "BATCH-CISCO-26A",
    "import_date": "2026-04-15",
    "expiry_date": null,
    "import_price": 70000000,
    "initial_qty": 5,
    "current_qty": 0,
    "status": "active"
  },
  {
    "id": 3,
    "product_id": 3,
    "product_name": "License Windows Server 2022",
    "sku": "MS-WS2022",
    "unit": "Key",
    "batch_code": "BATCH-MS-26B",
    "import_date": "2026-05-10",
    "expiry_date": "2027-05-10",
    "import_price": 20000000,
    "initial_qty": 50,
    "current_qty": 48,
    "status": "active"
  }
];
const INVENTORY_LOGS = [
  {
    "id": 1,
    "batch_id": 1,
    "product_name": "Dell PowerEdge R750",
    "batch_code": "BATCH-DELL-26A",
    "action_type": "IMPORT",
    "qty_change": 10,
    "reason": "Nhập hàng từ Dell EMC",
    "creator_name": "Phúc Trọng",
    "created_at": "2026-05-01T08:00:00Z"
  },
  {
    "id": 2,
    "batch_id": 1,
    "product_name": "Dell PowerEdge R750",
    "batch_code": "BATCH-DELL-26A",
    "action_type": "SALE",
    "qty_change": -6,
    "reason": "Xuất bán dự án Y tế",
    "creator_name": "Bảo Trâm",
    "created_at": "2026-05-05T14:30:00Z"
  },
  {
    "id": 3,
    "batch_id": 2,
    "product_name": "Cisco Catalyst 9300",
    "batch_code": "BATCH-CISCO-26A",
    "action_type": "IMPORT",
    "qty_change": 5,
    "reason": "Nhập hàng dự án",
    "creator_name": "Phúc Trọng",
    "created_at": "2026-04-15T09:15:00Z"
  },
  {
    "id": 4,
    "batch_id": 2,
    "product_name": "Cisco Catalyst 9300",
    "batch_code": "BATCH-CISCO-26A",
    "action_type": "SALE",
    "qty_change": -5,
    "reason": "Xuất bán dự án Ngân hàng",
    "creator_name": "Thế Anh",
    "created_at": "2026-04-20T10:00:00Z"
  },
  {
    "id": 5,
    "batch_id": 3,
    "product_name": "License Windows Server 2022",
    "batch_code": "BATCH-MS-26B",
    "action_type": "EXPORT_INTERNAL",
    "qty_change": -2,
    "reason": "Cài đặt test lab nội bộ",
    "creator_name": "Phúc Trọng",
    "created_at": "2026-05-11T16:45:00Z"
  }
];
const TICKETS: any[] = [];
const NOTIFICATIONS = [
  {
    "id": 1,
    "title": "Báo giá được duyệt",
    "content": "Khách hàng Sức Khỏe Vàng đã đồng ý báo giá",
    "is_read": 0,
    "created_at": "2026-05-12T12:14:11.356Z"
  },
  {
    "id": 2,
    "title": "Lịch hẹn sắp tới",
    "content": "Demo lúc 14:00 chiều nay với anh Tâm",
    "is_read": 0,
    "created_at": "2026-05-12T11:14:11.356Z"
  }
];
const TAGS: any[] = [];
const PIPELINE_STAGES = [
  {
    "id": "lead",
    "name": "Lead mới",
    "color": "#8b5cf6",
    "prob": 10
  },
  {
    "id": "contacted",
    "name": "Liên hệ",
    "color": "#3b82f6",
    "prob": 30
  },
  {
    "id": "demo",
    "name": "Demo/Meeting",
    "color": "#eab308",
    "prob": 50
  },
  {
    "id": "proposal",
    "name": "Đề xuất/Báo giá",
    "color": "#f97316",
    "prob": 70
  },
  {
    "id": "won",
    "name": "Chốt (Thắng)",
    "color": "#10b981",
    "prob": 100
  },
  {
    "id": "lost",
    "name": "Từ chối",
    "color": "#ef4444",
    "prob": 0
  }
];

interface MockState {
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
  inventory_logs: any[];
  notifications: any[];
  quotes: any[];
  pipeline_stages: any[];
  tags: any[];
  suppliers: any[];
  files: any[];
  addContact: (c: any) => void;
  addDeal: (d: any) => void;
  updateDeal: (updated: any) => void;
  markNotificationRead: (id: any) => void;
  addActivity: (a: any) => void;
}

export const useMockStore = create<MockState>()((set) => ({
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
  inventory_logs: INVENTORY_LOGS,
  notifications: NOTIFICATIONS,
  quotes: [],
  pipeline_stages: PIPELINE_STAGES,
  tags: TAGS,
  suppliers: [],
  files: [],
  addContact: (c) => set((s) => ({ contacts: [c, ...s.contacts] })),
  addDeal: (d) => set((s) => ({ deals: [d, ...s.deals] })),
  updateDeal: (updated) => set((s) => ({ deals: s.deals.map((d: any) => d.id === updated.id ? updated : d) })),
  markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n: any) => n.id === id ? { ...n, is_read: 1 } : n) })),
  addActivity: (a) => set((s) => ({ activities: [a, ...s.activities] })),
}));

export const getFilteredMockState = () => useMockStore.getState();
