const fs = require('fs');
const file = 'e:\\landingpage-main\\landingpage-main\\bba.html';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const bbaPricingHtml = `
        <!-- ══════════════════════════════════════════
             SECTION PRICING BBA
        ══════════════════════════════════════════ -->
        <div class="pricing-section reveal-up" id="bang-gia" style="margin-top: 80px; margin-bottom: 80px;">
            <div class="section-label" style="margin: 0 auto 1.5rem; display: table;">HỌC PHÍ & LỘ TRÌNH TÀI CHÍNH</div>
            <h3 class="pricing-title" style="text-align: center; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 900; color: #0f172a; margin-bottom: 32px; line-height: 1.2;">
                Cấu trúc học phí chương trình<br /><span style="color:#ab0e00">TOP-UP BBA</span>
            </h3>

            <div class="premium-policy-wrapper" style="max-width: 900px; margin: 0 auto; position: relative; padding: 0 20px;">
                <!-- Glow effect -->
                <div style="position: absolute; inset: -4px; background: linear-gradient(135deg, #ab0e00, #ff4c4c, #ab0e00); filter: blur(25px); opacity: 0.15; border-radius: 28px; z-index: 0;"></div>
                
                <div style="position: relative; background: linear-gradient(145deg, #0f172a, #0b1120); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); padding: 48px; box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 25px 50px -12px rgba(0,0,0,0.5); z-index: 1; overflow: hidden; color: #cbd5e1;">
                    
                    <!-- Header -->
                    <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 32px; margin-bottom: 32px;">
                         <h4 style="font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 900; color: #ffffff; margin-bottom: 16px; letter-spacing: -0.5px; background: linear-gradient(90deg, #f87171, #ab0e00); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CHÍNH SÁCH TUYỂN SINH & HỌC PHÍ</h4>
                         <p style="font-size: 1.05rem; line-height: 1.6; max-width: 800px; margin: 0 auto; color: #94a3b8; text-align: left;">
                             Áp dụng đến hết ngày <strong style="color: #fca5a5;">01/06/2026</strong>.<br/>
                             Áp dụng cho học viên hoàn tất đăng ký và thanh toán theo quy định trong thời gian trên.<br/><br/>
                             <strong style="color: #fff;">Ghi chú nhập học:</strong><br/>
                             <span style="display:inline-block; margin-top:8px;">● <strong>Để nhập học tháng 06/2026:</strong> Học viên phải hoàn tất hồ sơ và học phí trước ngày <strong style="color: #fca5a5;">25/05/2026</strong>.</span><br/>
                             <span style="display:inline-block; margin-top:4px;">● <strong>Để nhập học tháng 07/2026:</strong> Học viên phải hoàn tất hồ sơ và học phí đến hết ngày <strong style="color: #fca5a5;">01/06/2026</strong> để được áp dụng chính sách này.</span>
                         </p>
                    </div>

                    <!-- Note about UMEF payment -->
                    <div style="margin-bottom: 24px; padding: 16px 20px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 8px;">
                        <p style="margin: 0; font-size: 0.95rem; color: #93c5fd; line-height: 1.5;">
                            <strong style="color: #bfdbfe;">Đối với học phí của Swiss UMEF:</strong> Học viên sẽ được yêu cầu thanh toán trực tiếp cho Trường thông qua các kênh thanh toán được thông báo trên Invoice mà Trường cung cấp.
                        </p>
                    </div>

                    <!-- Table -->
                    <div style="overflow-x: auto; margin-bottom: 32px;">
                        <table style="width: 100%; border-collapse: collapse; min-width: 600px; text-align: left;">
                            <thead>
                                <tr style="background: rgba(171, 14, 0, 0.15); border-bottom: 1px solid rgba(171, 14, 0, 0.3);">
                                    <th style="padding: 16px; font-weight: 800; color: #fca5a5; font-size: 0.95rem; text-transform: uppercase;">Chi tiết lệ phí/học phí</th>
                                    <th style="padding: 16px; font-weight: 800; color: #fca5a5; font-size: 0.95rem; text-transform: uppercase; text-align: right;">Top Up (CHF)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- UMEF Section -->
                                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td colspan="2" style="padding: 12px 16px; font-weight: 800; color: #93c5fd; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">I. Học phí - UMEF <span style="font-size:0.75rem; color: #60a5fa; font-weight: 500; text-transform: none; margin-left: 8px;">(Thanh toán trực tiếp cho UMEF)</span></td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding: 16px; font-weight: 500; color: #cbd5e1; padding-left: 32px;">Lệ phí hồ sơ*</td>
                                    <td style="padding: 16px; font-weight: 700; color: #fff; text-align: right;">150 CHF</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding: 16px; font-weight: 500; color: #cbd5e1; padding-left: 32px;">Học phí cơ bản (platform)*</td>
                                    <td style="padding: 16px; font-weight: 700; color: #fff; text-align: right;">2.300 CHF</td>
                                </tr>
                                
                                <!-- IDEAS Section -->
                                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td colspan="2" style="padding: 12px 16px; font-weight: 800; color: #fca5a5; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">II. Phí hỗ trợ - IDEAS</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding: 16px; font-weight: 500; color: #cbd5e1; padding-left: 32px;">Dịch vụ chung <span style="font-size:0.85rem; color: #94a3b8; display: block; margin-top: 4px;">(Lớp chuyên đề, Hệ thống hỗ trợ)</span></td>
                                    <td style="padding: 16px; font-weight: 700; color: #fff; text-align: right; vertical-align: middle;">400 CHF</td>
                                </tr>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding: 16px; font-weight: 500; color: #cbd5e1; padding-left: 32px;">Canton & Lãnh sự & Tốt Nghiệp</td>
                                    <td style="padding: 16px; font-weight: 700; color: #fff; text-align: right;">200 CHF</td>
                                </tr>

                                <!-- Total -->
                                <tr style="background: rgba(171, 14, 0, 0.15);">
                                    <td style="padding: 20px 16px; font-weight: 900; color: #fff; font-size: 1.1rem; text-transform: uppercase;">Tổng cộng</td>
                                    <td style="padding: 20px 16px; font-weight: 900; color: #4ade80; font-size: 1.3rem; text-align: right;">3.050 CHF</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- CTA -->
                    <div style="text-align: center;">
                        <a href="#dang-ky" id="premium-cta-bba" style="display: inline-flex; align-items: center; justify-content: center; width: 100%; max-width: 320px; padding: 16px 24px; background: linear-gradient(135deg, #ab0e00, #ff4133); color: white !important; font-size: 1.1rem; font-weight: 700; text-decoration: none; border-radius: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 25px -5px rgba(171, 14, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1);">
                            <span>Tư vấn hồ sơ ngay</span>
                            <svg style="margin-left: 8px;" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                            </svg>
                        </a>
                    </div>
                    <style>
                        #premium-cta-bba:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 15px 35px -5px rgba(171, 14, 0, 0.6) !important;
                        }
                        @media (max-width: 640px) {
                            .premium-policy-wrapper > div:nth-child(2) {
                                padding: 32px 20px !important;
                            }
                        }
                    </style>
                </div>
            </div>
        </div>
`;

// Insert before line containing SECTION 6: CTA / FORM (line 3821-3822)
const ctaSectionIndex = lines.findIndex(l => l.includes('SECTION 6: CTA / FORM'));
if (ctaSectionIndex !== -1) {
    lines.splice(ctaSectionIndex - 1, 0, bbaPricingHtml);
} else {
    // If not found by comment, find by id="dang-ky"
    const dangKyIndex = lines.findIndex(l => l.includes('id="dang-ky"'));
    lines.splice(dangKyIndex, 0, bbaPricingHtml);
}

// Replace old fee in CTA
const newLines = lines.map(line => line.replace('1.550 CHF', '3.050 CHF'));

fs.writeFileSync(file, newLines.join('\n'), 'utf8');
console.log('Updated bba.html successfully');
