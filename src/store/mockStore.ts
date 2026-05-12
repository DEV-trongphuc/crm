
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
    "name": "Công ty CP Mekong 1",
    "industry": "Bất động sản & Xây dựng",
    "address": "Đường 1, TP. Hồ Chí Minh",
    "tax_id": "0713461647",
    "status": "active"
  },
  {
    "id": 2,
    "name": "Tập đoàn Mekong 2",
    "industry": "Logistics & Vận tải",
    "address": "Đường 2, TP. Hồ Chí Minh",
    "tax_id": "0749747445",
    "status": "active"
  },
  {
    "id": 3,
    "name": "Tổng công ty Đại Nam 3",
    "industry": "Tài chính - Ngân hàng",
    "address": "Đường 3, TP. Hồ Chí Minh",
    "tax_id": "0895416512",
    "status": "active"
  },
  {
    "id": 4,
    "name": "Tổng công ty Mekong 4",
    "industry": "Logistics & Vận tải",
    "address": "Đường 4, TP. Hồ Chí Minh",
    "tax_id": "0837683678",
    "status": "active"
  },
  {
    "id": 5,
    "name": "Công ty CP Đại Nam 5",
    "industry": "Bất động sản & Xây dựng",
    "address": "Đường 5, TP. Hồ Chí Minh",
    "tax_id": "0268713901",
    "status": "active"
  },
  {
    "id": 6,
    "name": "Công ty CP Mekong 6",
    "industry": "F&B & Chuỗi nhà hàng",
    "address": "Đường 6, TP. Hồ Chí Minh",
    "tax_id": "0886867236",
    "status": "active"
  },
  {
    "id": 7,
    "name": "Tập đoàn Mekong 7",
    "industry": "Logistics & Vận tải",
    "address": "Đường 7, TP. Hồ Chí Minh",
    "tax_id": "0222960064",
    "status": "active"
  },
  {
    "id": 8,
    "name": "Tổng công ty Đại Nam 8",
    "industry": "Y tế & Dược phẩm",
    "address": "Đường 8, TP. Hồ Chí Minh",
    "tax_id": "0139854291",
    "status": "active"
  },
  {
    "id": 9,
    "name": "Công ty CP Mekong 9",
    "industry": "F&B & Chuỗi nhà hàng",
    "address": "Đường 9, TP. Hồ Chí Minh",
    "tax_id": "0581011832",
    "status": "active"
  },
  {
    "id": 10,
    "name": "Tập đoàn Đại Nam 10",
    "industry": "Y tế & Dược phẩm",
    "address": "Đường 10, TP. Hồ Chí Minh",
    "tax_id": "0921862136",
    "status": "active"
  },
  {
    "id": 11,
    "name": "Công ty CP Nam Việt 11",
    "industry": "Bất động sản & Xây dựng",
    "address": "Đường 11, TP. Hồ Chí Minh",
    "tax_id": "0204580527",
    "status": "active"
  },
  {
    "id": 12,
    "name": "Công ty CP Nam Việt 12",
    "industry": "Sản xuất công nghiệp",
    "address": "Đường 12, TP. Hồ Chí Minh",
    "tax_id": "0505734996",
    "status": "active"
  },
  {
    "id": 13,
    "name": "Công ty CP Đại Nam 13",
    "industry": "Y tế & Dược phẩm",
    "address": "Đường 13, TP. Hồ Chí Minh",
    "tax_id": "0423633055",
    "status": "active"
  },
  {
    "id": 14,
    "name": "Tổng công ty Mekong 14",
    "industry": "Y tế & Dược phẩm",
    "address": "Đường 14, TP. Hồ Chí Minh",
    "tax_id": "0167759825",
    "status": "active"
  },
  {
    "id": 15,
    "name": "Tổng công ty Nam Việt 15",
    "industry": "Bán lẻ & Thương mại điện tử",
    "address": "Đường 15, TP. Hồ Chí Minh",
    "tax_id": "0514815265",
    "status": "active"
  },
  {
    "id": 16,
    "name": "Tập đoàn Mekong 16",
    "industry": "Công nghệ & Viễn thông",
    "address": "Đường 16, TP. Hồ Chí Minh",
    "tax_id": "0544990966",
    "status": "active"
  },
  {
    "id": 17,
    "name": "Tổng công ty Đại Nam 17",
    "industry": "Logistics & Vận tải",
    "address": "Đường 17, TP. Hồ Chí Minh",
    "tax_id": "0302247481",
    "status": "active"
  },
  {
    "id": 18,
    "name": "Tổng công ty Nam Việt 18",
    "industry": "Tài chính - Ngân hàng",
    "address": "Đường 18, TP. Hồ Chí Minh",
    "tax_id": "0878928664",
    "status": "active"
  },
  {
    "id": 19,
    "name": "Tổng công ty Nam Việt 19",
    "industry": "Giáo dục & Đào tạo",
    "address": "Đường 19, TP. Hồ Chí Minh",
    "tax_id": "0456210190",
    "status": "active"
  },
  {
    "id": 20,
    "name": "Tổng công ty Đại Nam 20",
    "industry": "Logistics & Vận tải",
    "address": "Đường 20, TP. Hồ Chí Minh",
    "tax_id": "0715501708",
    "status": "active"
  }
];
const CONTACTS = [
  {
    "id": 1,
    "first_name": "Nguyễn",
    "last_name": "Lan",
    "email": "contact1@example.com",
    "company_id": 2,
    "company_name": "Tập đoàn Mekong 2",
    "owner_id": 5,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 2,
    "first_name": "Nguyễn",
    "last_name": "Nam",
    "email": "contact2@example.com",
    "company_id": 1,
    "company_name": "Công ty CP Mekong 1",
    "owner_id": 3,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 3,
    "first_name": "Trần",
    "last_name": "Lan",
    "email": "contact3@example.com",
    "company_id": 7,
    "company_name": "Tập đoàn Mekong 7",
    "owner_id": 1,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 4,
    "first_name": "Trần",
    "last_name": "Lan",
    "email": "contact4@example.com",
    "company_id": 5,
    "company_name": "Công ty CP Đại Nam 5",
    "owner_id": 1,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 5,
    "first_name": "Nguyễn",
    "last_name": "Lan",
    "email": "contact5@example.com",
    "company_id": 19,
    "company_name": "Tổng công ty Nam Việt 19",
    "owner_id": 5,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 6,
    "first_name": "Nguyễn",
    "last_name": "Hải",
    "email": "contact6@example.com",
    "company_id": 12,
    "company_name": "Công ty CP Nam Việt 12",
    "owner_id": 2,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 7,
    "first_name": "Trần",
    "last_name": "Hải",
    "email": "contact7@example.com",
    "company_id": 12,
    "company_name": "Công ty CP Nam Việt 12",
    "owner_id": 2,
    "owner_name": "Phúc Trọng (Admin)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 8,
    "first_name": "Nguyễn",
    "last_name": "Hải",
    "email": "contact8@example.com",
    "company_id": 11,
    "company_name": "Công ty CP Nam Việt 11",
    "owner_id": 3,
    "owner_name": "Minh Khôi (Manager)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 9,
    "first_name": "Trần",
    "last_name": "Hải",
    "email": "contact9@example.com",
    "company_id": 10,
    "company_name": "Tập đoàn Đại Nam 10",
    "owner_id": 3,
    "owner_name": "Minh Khôi (Manager)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 10,
    "first_name": "Trần",
    "last_name": "Hải",
    "email": "contact10@example.com",
    "company_id": 11,
    "company_name": "Công ty CP Nam Việt 11",
    "owner_id": 1,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 11,
    "first_name": "Nguyễn",
    "last_name": "Hải",
    "email": "contact11@example.com",
    "company_id": 2,
    "company_name": "Tập đoàn Mekong 2",
    "owner_id": 1,
    "owner_name": "Phúc Trọng (Admin)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 12,
    "first_name": "Lê",
    "last_name": "Lan",
    "email": "contact12@example.com",
    "company_id": 16,
    "company_name": "Tập đoàn Mekong 16",
    "owner_id": 3,
    "owner_name": "Minh Khôi (Manager)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 13,
    "first_name": "Lê",
    "last_name": "Nam",
    "email": "contact13@example.com",
    "company_id": 11,
    "company_name": "Công ty CP Nam Việt 11",
    "owner_id": 2,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 14,
    "first_name": "Nguyễn",
    "last_name": "Lan",
    "email": "contact14@example.com",
    "company_id": 2,
    "company_name": "Tập đoàn Mekong 2",
    "owner_id": 3,
    "owner_name": "Minh Khôi (Manager)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 15,
    "first_name": "Nguyễn",
    "last_name": "Lan",
    "email": "contact15@example.com",
    "company_id": 20,
    "company_name": "Tổng công ty Đại Nam 20",
    "owner_id": 3,
    "owner_name": "Phúc Trọng (Admin)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 16,
    "first_name": "Nguyễn",
    "last_name": "Lan",
    "email": "contact16@example.com",
    "company_id": 19,
    "company_name": "Tổng công ty Nam Việt 19",
    "owner_id": 3,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 17,
    "first_name": "Nguyễn",
    "last_name": "Hải",
    "email": "contact17@example.com",
    "company_id": 9,
    "company_name": "Công ty CP Mekong 9",
    "owner_id": 2,
    "owner_name": "Minh Khôi (Manager)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 18,
    "first_name": "Trần",
    "last_name": "Nam",
    "email": "contact18@example.com",
    "company_id": 6,
    "company_name": "Công ty CP Mekong 6",
    "owner_id": 5,
    "owner_name": "Minh Khôi (Manager)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 19,
    "first_name": "Lê",
    "last_name": "Nam",
    "email": "contact19@example.com",
    "company_id": 1,
    "company_name": "Công ty CP Mekong 1",
    "owner_id": 1,
    "owner_name": "Minh Khôi (Manager)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 20,
    "first_name": "Trần",
    "last_name": "Hải",
    "email": "contact20@example.com",
    "company_id": 9,
    "company_name": "Công ty CP Mekong 9",
    "owner_id": 1,
    "owner_name": "Phúc Trọng (Admin)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 21,
    "first_name": "Nguyễn",
    "last_name": "Nam",
    "email": "contact21@example.com",
    "company_id": 11,
    "company_name": "Công ty CP Nam Việt 11",
    "owner_id": 1,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 22,
    "first_name": "Nguyễn",
    "last_name": "Lan",
    "email": "contact22@example.com",
    "company_id": 12,
    "company_name": "Công ty CP Nam Việt 12",
    "owner_id": 3,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 23,
    "first_name": "Lê",
    "last_name": "Lan",
    "email": "contact23@example.com",
    "company_id": 8,
    "company_name": "Tổng công ty Đại Nam 8",
    "owner_id": 3,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 24,
    "first_name": "Nguyễn",
    "last_name": "Lan",
    "email": "contact24@example.com",
    "company_id": 14,
    "company_name": "Tổng công ty Mekong 14",
    "owner_id": 3,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 25,
    "first_name": "Nguyễn",
    "last_name": "Lan",
    "email": "contact25@example.com",
    "company_id": 20,
    "company_name": "Tổng công ty Đại Nam 20",
    "owner_id": 3,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 26,
    "first_name": "Trần",
    "last_name": "Nam",
    "email": "contact26@example.com",
    "company_id": 9,
    "company_name": "Công ty CP Mekong 9",
    "owner_id": 5,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 27,
    "first_name": "Trần",
    "last_name": "Lan",
    "email": "contact27@example.com",
    "company_id": 2,
    "company_name": "Tập đoàn Mekong 2",
    "owner_id": 3,
    "owner_name": "Phúc Trọng (Admin)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 28,
    "first_name": "Nguyễn",
    "last_name": "Hải",
    "email": "contact28@example.com",
    "company_id": 2,
    "company_name": "Tập đoàn Mekong 2",
    "owner_id": 2,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 29,
    "first_name": "Nguyễn",
    "last_name": "Hải",
    "email": "contact29@example.com",
    "company_id": 4,
    "company_name": "Tổng công ty Mekong 4",
    "owner_id": 3,
    "owner_name": "Thế Anh (Sale 1)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  },
  {
    "id": 30,
    "first_name": "Nguyễn",
    "last_name": "Nam",
    "email": "contact30@example.com",
    "company_id": 17,
    "company_name": "Tổng công ty Đại Nam 17",
    "owner_id": 3,
    "owner_name": "Bảo Trâm (Sale 2)",
    "custom_fields": [
      {
        "id": 101,
        "label": "Sở thích",
        "field_type": "text",
        "value": "Đọc sách"
      },
      {
        "id": 102,
        "label": "Nguồn gốc",
        "field_type": "dropdown",
        "value": "Sự kiện",
        "options": [
          "Sự kiện",
          "Website"
        ]
      }
    ]
  }
];
const DEALS = [
  {
    "id": 1,
    "title": "Dự án ERP - Tổng công ty Đại Nam 20",
    "value": 85000000,
    "stage": "lead",
    "contact_id": 25,
    "company_id": 20,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 2,
    "title": "Dự án ERP - Công ty CP Nam Việt 11",
    "value": 99000000,
    "stage": "lead",
    "contact_id": 13,
    "company_id": 11,
    "owner_id": 2,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 3,
    "title": "Dự án ERP - Công ty CP Nam Việt 11",
    "value": 63000000,
    "stage": "lead",
    "contact_id": 21,
    "company_id": 11,
    "owner_id": 1,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 4,
    "title": "Dự án ERP - Tập đoàn Mekong 7",
    "value": 44000000,
    "stage": "lead",
    "contact_id": 3,
    "company_id": 7,
    "owner_id": 1,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 5,
    "title": "Dự án ERP - Công ty CP Mekong 6",
    "value": 45000000,
    "stage": "lead",
    "contact_id": 18,
    "company_id": 6,
    "owner_id": 5,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 6,
    "title": "Dự án ERP - Tập đoàn Mekong 7",
    "value": 10000000,
    "stage": "lead",
    "contact_id": 3,
    "company_id": 7,
    "owner_id": 1,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 7,
    "title": "Dự án ERP - Công ty CP Nam Việt 11",
    "value": 77000000,
    "stage": "lead",
    "contact_id": 21,
    "company_id": 11,
    "owner_id": 1,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 8,
    "title": "Dự án ERP - Tổng công ty Mekong 4",
    "value": 24000000,
    "stage": "lead",
    "contact_id": 29,
    "company_id": 4,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 9,
    "title": "Dự án ERP - Tổng công ty Nam Việt 19",
    "value": 31000000,
    "stage": "lead",
    "contact_id": 5,
    "company_id": 19,
    "owner_id": 5,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 10,
    "title": "Dự án ERP - Tổng công ty Đại Nam 17",
    "value": 49000000,
    "stage": "lead",
    "contact_id": 30,
    "company_id": 17,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 11,
    "title": "Dự án ERP - Tập đoàn Mekong 2",
    "value": 45000000,
    "stage": "lead",
    "contact_id": 27,
    "company_id": 2,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 12,
    "title": "Dự án ERP - Công ty CP Nam Việt 12",
    "value": 34000000,
    "stage": "lead",
    "contact_id": 22,
    "company_id": 12,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 13,
    "title": "Dự án ERP - Công ty CP Nam Việt 11",
    "value": 34000000,
    "stage": "lead",
    "contact_id": 13,
    "company_id": 11,
    "owner_id": 2,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 14,
    "title": "Dự án ERP - Tập đoàn Mekong 2",
    "value": 96000000,
    "stage": "lead",
    "contact_id": 27,
    "company_id": 2,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 15,
    "title": "Dự án ERP - Tổng công ty Nam Việt 19",
    "value": 23000000,
    "stage": "lead",
    "contact_id": 5,
    "company_id": 19,
    "owner_id": 5,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 16,
    "title": "Dự án ERP - Tổng công ty Nam Việt 19",
    "value": 49000000,
    "stage": "lead",
    "contact_id": 5,
    "company_id": 19,
    "owner_id": 5,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 17,
    "title": "Dự án ERP - Tổng công ty Mekong 4",
    "value": 33000000,
    "stage": "lead",
    "contact_id": 29,
    "company_id": 4,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 18,
    "title": "Dự án ERP - Tập đoàn Mekong 16",
    "value": 68000000,
    "stage": "lead",
    "contact_id": 12,
    "company_id": 16,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 19,
    "title": "Dự án ERP - Công ty CP Nam Việt 11",
    "value": 35000000,
    "stage": "lead",
    "contact_id": 10,
    "company_id": 11,
    "owner_id": 1,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 20,
    "title": "Dự án ERP - Công ty CP Nam Việt 11",
    "value": 49000000,
    "stage": "lead",
    "contact_id": 21,
    "company_id": 11,
    "owner_id": 1,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 21,
    "title": "Dự án ERP - Công ty CP Nam Việt 12",
    "value": 85000000,
    "stage": "lead",
    "contact_id": 22,
    "company_id": 12,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 22,
    "title": "Dự án ERP - Tập đoàn Mekong 2",
    "value": 51000000,
    "stage": "lead",
    "contact_id": 28,
    "company_id": 2,
    "owner_id": 2,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 23,
    "title": "Dự án ERP - Công ty CP Nam Việt 12",
    "value": 81000000,
    "stage": "lead",
    "contact_id": 7,
    "company_id": 12,
    "owner_id": 2,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 24,
    "title": "Dự án ERP - Tổng công ty Đại Nam 8",
    "value": 46000000,
    "stage": "lead",
    "contact_id": 23,
    "company_id": 8,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 25,
    "title": "Dự án ERP - Tập đoàn Mekong 2",
    "value": 76000000,
    "stage": "lead",
    "contact_id": 14,
    "company_id": 2,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 26,
    "title": "Dự án ERP - Tập đoàn Mekong 2",
    "value": 19000000,
    "stage": "lead",
    "contact_id": 27,
    "company_id": 2,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 27,
    "title": "Dự án ERP - Công ty CP Mekong 9",
    "value": 58000000,
    "stage": "lead",
    "contact_id": 26,
    "company_id": 9,
    "owner_id": 5,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 28,
    "title": "Dự án ERP - Tập đoàn Mekong 2",
    "value": 75000000,
    "stage": "lead",
    "contact_id": 27,
    "company_id": 2,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 29,
    "title": "Dự án ERP - Công ty CP Mekong 9",
    "value": 95000000,
    "stage": "lead",
    "contact_id": 20,
    "company_id": 9,
    "owner_id": 1,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  },
  {
    "id": 30,
    "title": "Dự án ERP - Tập đoàn Đại Nam 10",
    "value": 70000000,
    "stage": "lead",
    "contact_id": 9,
    "company_id": 10,
    "owner_id": 3,
    "custom_fields": [
      {
        "id": 1,
        "label": "Mã số thuế",
        "field_type": "text",
        "value": "0123456789"
      }
    ]
  }
];
const ACTIVITIES = [];
const EXPENSES = [];
const INVOICES = [];
const PRODUCTS = [];
const BATCHES = [];
const TICKETS = [];
const NOTIFICATIONS = [
  {
    "id": 1,
    "title": "Lead mới",
    "content": "Có khách hàng mới từ Website",
    "is_read": 0,
    "created_at": "2026-05-12T09:54:00.982Z"
  }
];
const TAGS = [];
const PIPELINE_STAGES = [
  {
    "id": "lead",
    "name": "Mới",
    "color": "#3b82f6",
    "prob": 20
  },
  {
    "id": "won",
    "name": "Thành công",
    "color": "#10b981",
    "prob": 100
  }
];

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
