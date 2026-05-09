import { create } from 'zustand';

/**
 * MOCK DATA STORE - DEV_MODE ONLY
 * Cung cấp dữ liệu mẫu phong phú để demo UI/UX mà không cần backend.
 */

const USERS = [
  { id: 1, full_name: 'Phúc Trọng (Admin)', email: 'admin@minth.io', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, full_name: 'Thế Anh (Sales)', email: 'sale@minth.io', role: 'sale', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, full_name: 'Minh Khôi (Manager)', email: 'manager@minth.io', role: 'manager', avatar: 'https://i.pravatar.cc/150?u=3' },
];

const COMPANIES = [
  { id: 1, name: 'Tập đoàn Công nghệ FPT', industry: 'Công nghệ & Viễn thông', address: 'Duy Tân, Cầu Giấy, Hà Nội', website: 'https://fpt.com.vn', tax_id: '0101248141', size: '500+', stage_id: 5, expected_revenue: 5000000000, status: 'active', legal_representative: 'Trương Gia Bình', logo: 'https://ui-avatars.com/api/?name=FPT&background=f97316&color=fff&size=128' },
  { id: 2, name: 'Vingroup JSC', industry: 'Đa ngành', address: 'Vinhomes Riverside, Long Biên, Hà Nội', website: 'https://vingroup.net', tax_id: '0100526974', size: '500+', stage_id: 1, expected_revenue: 12000000000, status: 'active', legal_representative: 'Phạm Nhật Vượng', logo: 'https://ui-avatars.com/api/?name=VINGROUP&background=dc2626&color=fff&size=128' },
  { id: 3, name: 'Ngân hàng TMCP Vietcombank', industry: 'Tài chính - Ngân hàng', address: '198 Trần Quang Khải, Hà Nội', website: 'https://vietcombank.com.vn', tax_id: '0100112437', size: '500+', stage_id: 4, expected_revenue: 850000000, status: 'active', logo: 'https://ui-avatars.com/api/?name=VCB&background=16a34a&color=fff&size=128' },
  { id: 4, name: 'Công ty CP Sữa Việt Nam (Vinamilk)', industry: 'F&B', address: '10 Tân Trào, Quận 7, TP.HCM', website: 'https://vinamilk.com.vn', tax_id: '0300588569', size: '500+', stage_id: 5, expected_revenue: 3200000000, status: 'active', logo: 'https://ui-avatars.com/api/?name=VNM&background=2563eb&color=fff&size=128' },
  { id: 5, name: 'Giao Hàng Tiết Kiệm (GHTK)', industry: 'Logistics', address: 'Phạm Hùng, Từ Liêm, Hà Nội', website: 'https://ghtk.vn', tax_id: '0106181234', size: '500+', stage_id: 2, expected_revenue: 1500000000, status: 'prospect', logo: 'https://ui-avatars.com/api/?name=GHTK&background=059669&color=fff&size=128' },
  { id: 6, name: 'Công ty CP Thế Giới Di Động', industry: 'Bán lẻ', address: 'Quận 9, TP.HCM', website: 'https://mwg.vn', tax_id: '0303217354', size: '500+', stage_id: 3, expected_revenue: 4500000000, status: 'active', logo: 'https://ui-avatars.com/api/?name=MWG&background=fbbf24&color=000&size=128' },
  { id: 7, name: 'Shopee Việt Nam', industry: 'E-commerce', address: 'Quận 1, TP.HCM', website: 'https://shopee.vn', tax_id: '0106774844', size: '500+', stage_id: 4, expected_revenue: 2800000000, status: 'active', logo: 'https://ui-avatars.com/api/?name=Shopee&background=ea580c&color=fff&size=128' },
  { id: 8, name: 'VNG Corporation', industry: 'Công nghệ / Games', address: 'Quận 7, TP.HCM', website: 'https://vng.com.vn', tax_id: '0303543740', size: '500+', stage_id: 5, expected_revenue: 1800000000, status: 'active', logo: 'https://ui-avatars.com/api/?name=VNG&background=f97316&color=fff&size=128' },
  { id: 9, name: 'Công ty CP Hàng không Vietjet', industry: 'Hàng không', address: 'Quận Tân Bình, TP.HCM', website: 'https://vietjetair.com', tax_id: '0102325399', size: '500+', stage_id: 2, expected_revenue: 6500000000, status: 'active', logo: 'https://ui-avatars.com/api/?name=VJC&background=dc2626&color=fff&size=128' },
  { id: 10, name: 'Grab Việt Nam', industry: 'Technology Service', address: 'Quận 7, TP.HCM', website: 'https://grab.com/vn', tax_id: '0312650437', size: '500+', stage_id: 3, expected_revenue: 950000000, status: 'prospect', logo: 'https://ui-avatars.com/api/?name=Grab&background=16a34a&color=fff&size=128' },
];

const CONTACTS = [
  { id: 1, first_name: 'Nguyễn', last_name: 'Quang Anh', email: 'anh.nq@fpt.com.vn', phone: '0901234567', company_id: 1, company_name: 'FPT Corp', job_title: 'Giám đốc Công nghệ (CTO)', status: 'customer', source: 'referral', last_contact: '2026-05-06', owner_id: 2, stage_id: 5, expected_revenue: 2500000000, tags: ['Khách VIP', 'Tech Giant'], avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: 2, first_name: 'Trần', last_name: 'Thanh Hà', email: 'ha.tt@vingroup.net', phone: '0987654321', company_id: 2, company_name: 'Vingroup', job_title: 'Trưởng phòng Mua sắm', status: 'qualified', source: 'website', last_contact: '2026-05-01', owner_id: 1, stage_id: 1, expected_revenue: 8500000000, tags: ['BĐS', 'Potential'], avatar: 'https://i.pravatar.cc/150?u=5' },
  { id: 3, first_name: 'Lê', last_name: 'Hoàng Nam', email: 'nam.lh@vietcombank.com.vn', phone: '0912123123', company_id: 3, company_name: 'Vietcombank', job_title: 'Phó TGĐ Tài chính', status: 'lead', source: 'cold_call', last_contact: '2026-04-20', owner_id: 3, stage_id: 4, expected_revenue: 450000000, avatar: 'https://i.pravatar.cc/150?u=6' },
  { id: 4, first_name: 'Phạm', last_name: 'Thị Tuyết', email: 'tuyet.pt@vinamilk.com.vn', phone: '0933445566', company_id: 4, company_name: 'Vinamilk', job_title: 'Quản lý Chuỗi cung ứng', status: 'customer', source: 'social', last_contact: '2026-05-05', owner_id: 2, stage_id: 5, expected_revenue: 1200000000, avatar: 'https://i.pravatar.cc/150?u=7' },
  { id: 5, first_name: 'Hoàng', last_name: 'Minh Đức', email: 'duc.hm@ghtk.vn', phone: '0966778899', company_id: 5, company_name: 'GHTK', job_title: 'Head of Operations', status: 'qualified', source: 'event', last_contact: '2026-04-30', owner_id: 1, stage_id: 2, expected_revenue: 3000000000, avatar: 'https://i.pravatar.cc/150?u=8' },
  { id: 6, first_name: 'Đặng', last_name: 'Hải Yến', email: 'yen.dh@mwg.vn', phone: '0944556677', company_id: 6, company_name: 'Thế Giới Di Động', job_title: 'Giám đốc Nhân sự', status: 'customer', source: 'other', last_contact: '2026-05-02', owner_id: 2, stage_id: 3, expected_revenue: 1500000000, avatar: 'https://i.pravatar.cc/150?u=9' },
  { id: 7, first_name: 'Vũ', last_name: 'Duy Mạnh', email: 'manh.vd@shopee.vn', phone: '0909090909', company_id: 7, company_name: 'Shopee', job_title: 'E-commerce Director', status: 'qualified', source: 'referral', last_contact: '2026-05-04', owner_id: 1, stage_id: 4, expected_revenue: 2800000000, avatar: 'https://i.pravatar.cc/150?u=10' },
  { id: 8, first_name: 'Bùi', last_name: 'Thị Lan', email: 'lan.bt@vng.com.vn', phone: '0911222333', company_id: 8, company_name: 'VNG', job_title: 'Project Manager', status: 'customer', source: 'website', last_contact: '2026-05-07', owner_id: 3, stage_id: 5, expected_revenue: 1800000000, avatar: 'https://i.pravatar.cc/150?u=11' },
];

const DEALS = [
  { id: 1, title: 'Hợp đồng ERP Toàn diện cho FPT', value: 2500000000, stage: 'negotiation', contact_id: 1, company_id: 1, company_name: 'FPT Corp', probability: 80, expected_close: '2026-06-30', owner_id: 2, stage_color: '#3b82f6' },
  { id: 2, title: 'Hệ thống Quản lý Bán lẻ Vincom', value: 8500000000, stage: 'lead', contact_id: 2, company_id: 2, company_name: 'Vingroup', probability: 20, expected_close: '2026-12-15', owner_id: 1, stage_color: '#94a3b8' },
  { id: 3, title: 'Triển khai hạ tầng Cloud VCB', value: 450000000, stage: 'proposal', contact_id: 3, company_id: 3, company_name: 'Vietcombank', probability: 50, expected_close: '2026-05-25', owner_id: 3, stage_color: '#f59e0b' },
  { id: 4, title: 'Bảo trì Phần mềm Logisitcs T5/2026', value: 1200000000, stage: 'won', contact_id: 4, company_id: 4, company_name: 'Vinamilk', probability: 100, expected_close: '2026-05-10', owner_id: 2, stage_color: '#10b981' },
  { id: 5, title: 'Giải pháp Smart Warehouse GHTK', value: 3000000000, stage: 'contacted', contact_id: 5, company_id: 5, company_name: 'GHTK', probability: 35, expected_close: '2026-08-20', owner_id: 1, stage_color: '#6366f1' },
  { id: 6, title: 'Cung cấp 500 Licenses CRM MWG', value: 1500000000, stage: 'negotiation', contact_id: 6, company_id: 6, company_name: 'Thế Giới Di Động', probability: 70, expected_close: '2026-07-05', owner_id: 2, stage_color: '#3b82f6' },
  { id: 7, title: 'Hợp tác Chiến lược Marketing Shopee', value: 2800000000, stage: 'proposal', contact_id: 7, company_id: 7, company_name: 'Shopee', probability: 55, expected_close: '2026-06-20', owner_id: 1, stage_color: '#f59e0b' },
  { id: 8, title: 'Gói hạ tầng Game VNG Tầng 5', value: 1800000000, stage: 'won', contact_id: 8, company_id: 8, company_name: 'VNG', probability: 100, expected_close: '2026-05-01', owner_id: 3, stage_color: '#10b981' },
  { id: 9, title: 'Chuỗi cung ứng thông minh Grab', value: 4200000000, stage: 'contacted', contact_id: 10, company_id: 10, company_name: 'Grab Vietnam', probability: 40, expected_close: '2026-09-12', owner_id: 1, stage_color: '#6366f1' },
  { id: 10, title: 'Bảo mật dữ liệu Vietjet Air', value: 650000000, stage: 'lead', contact_id: 9, company_id: 9, company_name: 'Vietjet Air', probability: 15, expected_close: '2026-11-20', owner_id: 2, stage_color: '#94a3b8' },
  { id: 11, title: 'Tối ưu hóa CRM - Vinamilk', value: 350000000, stage: 'negotiation', contact_id: 4, company_id: 4, company_name: 'Vinamilk', probability: 60, expected_close: '2026-08-15', owner_id: 2, stage_color: '#3b82f6' },
  { id: 12, title: 'Bảo trì hệ thống MWG Q3/2026', value: 500000000, stage: 'proposal', contact_id: 6, company_id: 6, company_name: 'Thế Giới Di Động', probability: 45, expected_close: '2026-10-01', owner_id: 1, stage_color: '#f59e0b' },
  { id: 13, title: 'Nâng cấp Server Vietcombank', value: 3500000000, stage: 'won', contact_id: 3, company_id: 3, company_name: 'Vietcombank', probability: 100, expected_close: '2026-04-10', owner_id: 3, stage_color: '#10b981' },
  { id: 14, title: 'Cung cấp Laptop cho FPT Software', value: 1200000000, stage: 'won', contact_id: 1, company_id: 1, company_name: 'FPT Corp', probability: 100, expected_close: '2026-02-28', owner_id: 2, stage_color: '#10b981' },
];

const ACTIVITIES = [
  { 
    id: 1, 
    subject: 'Họp chốt phương án ERP (Online)', 
    type: 'meeting', 
    status: 'planned', 
    user_name: 'Phúc Trọng', 
    due_date: new Date(Date.now() + 86400000).toISOString(), 
    contact_id: 1, contact_name: 'Nguyễn Quang Anh',
    body: 'Thảo luận về roadmap triển khai module kế toán. Khách hàng yêu cầu tập trung vào báo cáo thuế thông tư 200.', 
    metadata: { zoom_link: 'https://zoom.us/j/123456', participants: ['Nguyễn Quang Anh', 'Phúc Trọng', 'Minh Khôi'] }, 
    created_at: new Date(Date.now() - 3600000).toISOString() 
  },
  { 
    id: 2, 
    subject: 'Cuộc gọi tư vấn: Giải pháp POS', 
    type: 'call', 
    status: 'done', 
    user_name: 'Thế Anh', 
    due_date: '2026-05-05T09:30:00Z', 
    contact_id: 2, contact_name: 'Trần Thanh Hà',
    body: 'Chị Hà quan tâm đến việc tích hợp với phần mềm KiotViet. Đã giải thích về khả năng API của Minth.', 
    metadata: { duration: '12m 45s', recording_url: 'https://cdn.minth.io/recordings/call_123.mp3' }, 
    created_at: '2026-05-05T09:30:00Z' 
  },
  { 
    id: 3, 
    subject: 'Follow-up Email: Hạ tầng Cloud VCB', 
    type: 'email', 
    status: 'done', 
    user_name: 'Minh Khôi', 
    due_date: '2026-05-06T14:20:00Z', 
    contact_id: 3, contact_name: 'Lê Hoàng Nam',
    body: 'Gửi báo giá chi tiết và cam kết SLA cho hạ tầng ngân hàng.', 
    metadata: { email_subject: 'Re: Hạ tầng Cloud VCB - Minth CRM Proposal', status: 'opened', opens: 3 }, 
    created_at: '2026-05-06T14:20:00Z' 
  },
  { 
    id: 4, 
    subject: 'Khảo sát thực địa kho Quận 7', 
    type: 'task', 
    status: 'done', 
    user_name: 'Thế Anh', 
    due_date: '2026-05-03T08:00:00Z', 
    contact_id: 4, contact_name: 'Phạm Thị Tuyết',
    body: 'Đã hoàn thành khảo sát thực địa kho lạnh. Cần bổ sung 3 camera góc rộng.', 
    metadata: { location: 'Lô A, KCN Tân Thuận, Q7', photos: 4 }, 
    created_at: '2026-05-03T08:00:00Z' 
  },
  { id: 5, subject: 'Demo Smart Warehouse GHTK', type: 'meeting', status: 'planned', user_name: 'Phúc Trọng', due_date: new Date(Date.now() + 172800000).toISOString(), contact_id: 5, contact_name: 'Hoàng Minh Đức', body: 'Thuyết trình giải pháp tự động hóa kho bằng robot.', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 6, subject: 'Gửi quà tặng kỷ niệm 10 năm', type: 'note', status: 'done', user_name: 'Phúc Trọng', due_date: '2026-05-02T10:00:00Z', contact_id: 6, contact_name: 'Đặng Hải Yến', body: 'Đã gửi lẵng hoa và thiệp chúc mừng. Khách hàng rất hài lòng.', created_at: '2026-05-02T10:00:00Z' },
  { id: 7, subject: 'Xử lý phản hồi điều khoản bảo trì', type: 'task', status: 'planned', user_name: 'Minh Khôi', due_date: new Date(Date.now() - 25920000).toISOString(), contact_id: 7, contact_name: 'Vũ Duy Mạnh', body: 'Cập nhật lại SLA bảo trì 24/7 theo yêu cầu từ phòng pháp chế Shopee.', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: 8, subject: 'Gặp mặt ăn trưa ký HĐ VNG', type: 'meeting', status: 'planned', user_name: 'Thế Anh', due_date: new Date(Date.now() + 3600000).toISOString(), contact_id: 8, contact_name: 'Bùi Thị Lan', body: 'Ăn trưa tại nhà hàng Sushi Hokkaido Sachi và chốt Hợp đồng Tầng 5.', created_at: new Date().toISOString() },
];

const EXPENSES = [
  { id: 1, title: 'Thuê văn phòng Landmark 81 - T5', amount: 85000000, date: '2026-05-01', category: 'Vận hành', creator_name: 'Phúc Trọng', status: 'approved', vendor_name: 'Vinhomes', has_vat_invoice: true, is_vat_inclusive: true, approver_id: 1 },
  { id: 2, title: 'Google Cloud Platform Usage (Apr)', amount: 45000000, date: '2026-05-02', category: 'Cơ sở hạ tầng', creator_name: 'Minh Khôi', status: 'approved', vendor_name: 'Google Asia Pacific', has_vat_invoice: false, is_vat_inclusive: true, approver_id: 1 },
  { id: 3, title: 'Team Building Vũng Tàu', amount: 32000000, date: '2026-05-04', category: 'Nhân sự', creator_name: 'Thế Anh', status: 'pending', vendor_name: 'Pullman Vung Tau', has_vat_invoice: true, is_vat_inclusive: true, approver_id: 1 },
  { id: 4, title: 'Mua sắm Laptop Dell XPS (x3)', amount: 120000000, date: '2026-05-06', category: 'Thiết bị', creator_name: 'Phúc Trọng', status: 'approved', vendor_name: 'Phong Vũ IT', has_vat_invoice: true, is_vat_inclusive: true, approver_id: 1 },
  { id: 5, title: 'Tiền Grab Business (Toàn team T4)', amount: 8500000, date: '2026-05-03', category: 'Vận chuyển', creator_name: 'Admin', status: 'approved', vendor_name: 'Grab Vietnam', has_vat_invoice: true, is_vat_inclusive: true, approver_id: 1 },
  { id: 6, title: 'Chi phí tiếp khách Shopee (Buffet Nikko)', amount: 4200000, date: '2026-05-07', category: 'Tiếp khách', creator_name: 'Minh Khôi', status: 'pending', vendor_name: 'Hotel Nikko Saigon', has_vat_invoice: true, is_vat_inclusive: true, approver_id: 1 },
  { id: 7, title: 'Gói tài trợ giải đấu Game VNG', amount: 25000000, date: '2026-05-08', category: 'Marketing', creator_name: 'Phúc Trọng', status: 'pending', vendor_name: 'VNG Corp', has_vat_invoice: true, is_vat_inclusive: true, approver_id: 1 },
  { id: 8, title: 'Sửa chữa điều hòa Tầng 3', amount: 3500000, date: '2026-05-09', category: 'Bảo trì', creator_name: 'Thế Anh', status: 'approved', vendor_name: 'Điện Máy Xanh', has_vat_invoice: true, is_vat_inclusive: true, approver_id: 1 },
];

const INVOICES = [
  { id: 1, invoice_no: 'INV-2026-0001', contact_id: 1, contact_name: 'Nguyễn Quang Anh', total: 2500000000, date: '2026-05-01', due_date: '2026-06-01', status: 'unpaid', items: [{name: 'Hợp đồng ERP', qty: 1, price: 2500000000}] },
  { id: 2, invoice_no: 'INV-2026-0002', contact_id: 4, contact_name: 'Phạm Thị Tuyết', total: 1200000000, date: '2026-05-02', due_date: '2026-05-15', status: 'paid', items: [{name: 'Bảo trì Phần mềm', qty: 1, price: 1200000000}] },
  { id: 3, invoice_no: 'INV-2026-0003', contact_id: 8, contact_name: 'Bùi Thị Lan', total: 1800000000, date: '2026-05-05', due_date: '2026-06-05', status: 'unpaid', items: [{name: 'Hạ tầng Game', qty: 1, price: 1800000000}] },
  { id: 4, invoice_no: 'INV-2026-0004', contact_id: 3, contact_name: 'Lê Hoàng Nam', total: 3500000000, date: '2026-04-10', due_date: '2026-04-20', status: 'paid', items: [{name: 'Nâng cấp Server', qty: 1, price: 3500000000}] },
  { id: 5, invoice_no: 'INV-2026-0005', contact_id: 1, contact_name: 'Nguyễn Quang Anh', total: 1200000000, date: '2026-02-28', due_date: '2026-03-15', status: 'paid', items: [{name: 'Laptop Dell XPS 15', qty: 30, price: 40000000}] },
];

const TICKETS = [
  { id: 1, subject: 'Lỗi đồng bộ dữ liệu API FPT', customer_name: 'Nguyễn Quang Anh', priority: 'high', status: 'open', created_at: '2026-05-07T10:00:00Z', assigned_to: 'Minh Khôi' },
  { id: 2, subject: 'Yêu cầu thay đổi thông tin Hóa đơn Vingroup', customer_name: 'Trần Thanh Hà', priority: 'medium', status: 'pending', created_at: '2026-05-06T14:20:00Z', assigned_to: 'Phúc Trọng' },
  { id: 3, subject: 'Hướng dẫn cấu hình bảo mật kho Vinamilk', customer_name: 'Phạm Thị Tuyết', priority: 'low', status: 'closed', created_at: '2026-05-04T09:00:00Z', assigned_to: 'Thế Anh' },
  { id: 4, subject: 'Không nhận được email thông báo Shopee', customer_name: 'Vũ Duy Mạnh', priority: 'high', status: 'open', created_at: '2026-05-07T08:00:00Z', assigned_to: 'Minh Khôi' },
  { id: 5, subject: 'Cần hỗ trợ gấp: Server bị down', customer_name: 'Hoàng Minh Đức', priority: 'high', status: 'open', created_at: new Date().toISOString(), assigned_to: 'Phúc Trọng' },
];

const PRODUCTS = [
  { id: 1, name: 'Hệ thống ERP Doanh nghiệp (Enterprise)', sku: 'ERP-ENT-01', category: 'Phần mềm', price: 1500000000, unit: 'hợp đồng', is_active: true, description: 'Giải pháp quản trị doanh nghiệp toàn diện bao gồm Kế toán, Nhân sự, Kho.', stock: 10, image: 'https://images.unsplash.com/photo-1551288049-bbda48642151?w=800' },
  { id: 2, name: 'Dịch vụ Cloud Infrastructure (AWS)', sku: 'CLD-AWS-INF', category: 'Cơ sở hạ tầng', price: 50000000, unit: 'tháng', is_active: true, description: 'Hạ tầng điện toán đám mây Amazon Web Services.', stock: 99, image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800' },
  { id: 3, name: 'Máy chủ Dell PowerEdge R740', sku: 'HW-DELL-R740', category: 'Phần cứng', price: 125000000, unit: 'bộ', is_active: true, description: 'Server cấu hình cao cho doanh nghiệp.', stock: 5, image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=800' },
  { id: 4, name: 'Laptop Dell XPS 15 2026', sku: 'HW-LAP-XPS15', category: 'Thiết bị', price: 45000000, unit: 'cái', is_active: true, description: 'Laptop cao cấp cho nhân viên văn phòng.', stock: 12, image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800' },
  { id: 5, name: 'Khóa đào tạo Quản trị CRM', sku: 'SV-TRAIN-CRM', category: 'Dịch vụ', price: 15000000, unit: 'khóa', is_active: true, description: 'Đào tạo kỹ năng quản lý khách hàng cho đội ngũ sales.', stock: 50, image: 'https://images.unsplash.com/photo-1524178232363-1fb28f74b0cd?w=800' },
];

const BATCHES = [
  { id: 1, product_id: 3, product_name: 'Máy chủ Dell PowerEdge R740', sku: 'HW-DELL-R740', category: 'Phần cứng', unit: 'bộ', supplier_name: 'Dell Technologies Vietnam', batch_code: 'DELL-2026-Q1', import_date: '2026-03-15', expiry_date: null, import_price: 95000000, initial_qty: 10, current_qty: 3, notes: 'Lô hàng nhập khẩu chính ngạch.', status: 'active' },
  { id: 2, product_id: 4, product_name: 'Laptop Dell XPS 15 2026', sku: 'HW-LAP-XPS15', category: 'Thiết bị', unit: 'cái', supplier_name: 'Phong Vũ IT', batch_code: 'PV-XPS-001', import_date: '2026-05-01', expiry_date: null, import_price: 38000000, initial_qty: 20, current_qty: 12, notes: 'Hàng bảo hành 12 tháng.', status: 'active' },
  { id: 3, product_id: 1, product_name: 'Hệ thống ERP Doanh nghiệp (Enterprise)', sku: 'ERP-ENT-01', category: 'Phần mềm', unit: 'license', supplier_name: 'Minth Corp', batch_code: 'MINTH-ERP-01', import_date: '2026-01-01', expiry_date: null, import_price: 500000000, initial_qty: 50, current_qty: 10, notes: 'Bản quyền vô thời hạn.', status: 'active' },
];

const QUOTES = [
  { id: 1, quote_number: 'QT-2026-001', title: 'Giải pháp ERP cho FPT', total: 2500000000, status: 'accepted', valid_until: '2026-06-30', created_at: '2026-05-01', contact_name: 'Nguyễn Quang Anh', company_name: 'FPT Corp' },
  { id: 2, quote_number: 'QT-2026-002', title: 'Báo giá Server Dell R740', total: 125000000, status: 'sent', valid_until: '2026-05-30', created_at: '2026-05-02', contact_name: 'Trần Thanh Hà', company_name: 'Vingroup' },
  { id: 3, quote_number: 'QT-2026-003', title: 'Gói bảo trì phần mềm T5', total: 45000000, status: 'draft', valid_until: '2026-05-15', created_at: '2026-05-05', contact_name: 'Phạm Thị Tuyết', company_name: 'Vinamilk' },
];

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

const FILES = [
  { id: 1, name: 'Hợp đồng ERP - FPT.pdf', file_size: 2500000, mime_type: 'application/pdf', file_path: 'uploads/file1.pdf', uploader_name: 'Phúc Trọng', created_at: '2026-05-01', category: 'contract' },
  { id: 2, name: 'Minth_CRM_Presentation.pptx', file_size: 15000000, mime_type: 'application/vnd.ms-powerpoint', file_path: 'uploads/file2.pptx', uploader_name: 'Minh Khôi', created_at: '2026-05-02', category: 'marketing' },
  { id: 3, name: 'Bảng giá dịch vụ 2026.xlsx', file_size: 450000, mime_type: 'application/vnd.ms-excel', file_path: 'uploads/file3.xlsx', uploader_name: 'Thế Anh', created_at: '2026-05-05', category: 'template' },
  { id: 4, name: 'Logo_Minth_HighRes.png', file_size: 8500000, mime_type: 'image/png', file_path: 'uploads/file4.png', uploader_name: 'Phúc Trọng', created_at: '2026-05-06', category: 'marketing' },
];

const NOTIFICATIONS = [
  { id: 1, title: 'Hóa đơn INV-2026-0001 quá hạn', body: 'FPT Corp chưa thanh toán hóa đơn giá trị 2.5 tỷ VND.', type: 'error', is_read: 0, created_at: new Date().toISOString() },
  { id: 2, title: 'Cơ hội mới từ Vingroup', body: 'Chị Hà vừa yêu cầu báo giá thêm module POS.', type: 'info', is_read: 0, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, title: 'Hàng trong kho sắp hết', body: 'Máy chủ Dell R740 chỉ còn 3 bộ trong kho.', type: 'warning', is_read: 0, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, title: 'Yêu cầu hỗ trợ mới (High)', customer_name: 'Vũ Duy Mạnh', type: 'error', is_read: 1, created_at: new Date(Date.now() - 14400000).toISOString() },
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
