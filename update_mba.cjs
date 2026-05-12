const fs = require('fs');

function getHtml(title, stdChf, stdVnd, hqChf, hqVnd) {
    return `
                <!-- Pricing -->
                <div class="pricing-section reveal-up" id="bang-gia" style="text-align: center; margin-bottom: 64px;">
                    <div class="section-label" style="margin: 0 auto 1.5rem; display: table;">HỌC PHÍ & LỘ TRÌNH TÀI CHÍNH</div>
                    <h3 class="pricing-title"
                        style="text-align: center; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 900; color: #0f172a; margin-bottom: 32px; line-height: 1.2;">
                        Cấu trúc học phí chương trình<br /><span style="color:#ab0e00">${title}</span>
                    </h3>

                    <div class="premium-policy-wrapper" style="max-width: 1000px; margin: 0 auto; position: relative; text-align: left; padding: 0 20px;">
                        <!-- Glow effect -->
                        <div style="position: absolute; inset: -4px; background: linear-gradient(135deg, #ab0e00, #ff4c4c, #ab0e00); filter: blur(25px); opacity: 0.15; border-radius: 28px; z-index: 0;"></div>
                        
                        <div style="position: relative; background: linear-gradient(145deg, #0f172a, #0b1120); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); padding: 48px; box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 25px 50px -12px rgba(0,0,0,0.5); z-index: 1; overflow: hidden; color: #cbd5e1;">
                            
                            <!-- Header -->
                            <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 32px; margin-bottom: 32px;">
                                 <h4 style="font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 900; color: #ffffff; margin-bottom: 16px; letter-spacing: -0.5px; background: linear-gradient(90deg, #f87171, #ab0e00); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CHÍNH SÁCH HỌC PHÍ THÁNG 5</h4>
                                 <p style="font-size: 1.05rem; line-height: 1.6; max-width: 800px; margin: 0 auto; color: #94a3b8;">
                                     Thời gian áp dụng: đến hết ngày <strong style="color: #fca5a5;">01/06/2026</strong>.<br/>
                                     <span style="font-size: 0.95rem; margin-top: 8px; display: inline-block;">
                                        ● Học phí được đóng 01 lần ngay khi có thư chấp thuận của Swiss UMEF.<br/>
                                        ● Học phí được áp dụng tỷ giá 33.000 VNĐ.<br/>
                                        ● Học viên thanh toán qua IDEAS không phụ thu phí dịch vụ thu hộ.
                                     </span>
                                 </p>
                            </div>

                            <!-- Cards Grid -->
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 16px;">
                                
                                <!-- Standard Card -->
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 20px 40px rgba(0,0,0,0.4)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
                                    <div style="font-size: 0.9rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">01. Hình thức</div>
                                    <h5 style="font-size: 1.8rem; font-weight: 900; color: #fff; margin: 0 0 24px 0;">Standard (ST)</h5>
                                    
                                    <div style="margin-bottom: 32px;">
                                        <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 4px;">Học phí sau chính sách</div>
                                        <div style="display: flex; align-items: baseline; gap: 8px;">
                                            <span style="font-size: 2.2rem; font-weight: 900; color: #f87171;">${stdChf}</span>
                                            <span style="font-size: 1.1rem; font-weight: 700; color: #fca5a5;">CHF</span>
                                        </div>
                                        <div style="font-size: 1.1rem; font-weight: 700; color: #4ade80; margin-top: 8px;">~ ${stdVnd} VNĐ</div>
                                    </div>
                                    
                                    <a href="#dang-ky" style="display: block; width: 100%; padding: 14px; text-align: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">Đăng ký Standard</a>
                                </div>

                                <!-- High Quality Card -->
                                <div style="background: linear-gradient(180deg, rgba(171, 14, 0, 0.15) 0%, rgba(255,255,255,0.03) 100%); border: 1px solid rgba(171, 14, 0, 0.4); border-radius: 16px; padding: 32px; position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 20px 40px rgba(171, 14, 0, 0.2)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
                                    <div style="position: absolute; top: 0; right: 0; background: linear-gradient(90deg, #f87171, #ab0e00); color: #fff; font-size: 0.75rem; font-weight: 800; padding: 6px 16px; border-bottom-left-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">Khuyên dùng</div>
                                    
                                    <div style="font-size: 0.9rem; font-weight: 800; color: #fca5a5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">02. Hình thức</div>
                                    <h5 style="font-size: 1.8rem; font-weight: 900; color: #fff; margin: 0 0 24px 0;">High Quality</h5>
                                    
                                    <div style="margin-bottom: 32px;">
                                        <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 4px;">Học phí sau chính sách</div>
                                        <div style="display: flex; align-items: baseline; gap: 8px;">
                                            <span style="font-size: 2.2rem; font-weight: 900; color: #f87171;">${hqChf}</span>
                                            <span style="font-size: 1.1rem; font-weight: 700; color: #fca5a5;">CHF</span>
                                        </div>
                                        <div style="font-size: 1.1rem; font-weight: 700; color: #4ade80; margin-top: 8px;">~ ${hqVnd} VNĐ</div>
                                    </div>
                                    
                                    <a href="#dang-ky" style="display: block; width: 100%; padding: 14px; text-align: center; background: linear-gradient(135deg, #ab0e00, #ff4133); border: 1px solid rgba(255,255,255,0.1); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; transition: filter 0.3s;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='none'">Đăng ký High Quality</a>
                                </div>

                            </div>
                            
                            <style>
                                @media (max-width: 640px) {
                                    .premium-policy-wrapper > div:nth-child(2) {
                                        padding: 32px 20px !important;
                                    }
                                }
                            </style>
                        </div>
                    </div>
`;
}

function processFile(filePath, title, stdChf, stdVnd, hqChf, hqVnd) {
    let content = fs.readFileSync(filePath, 'utf8');
    // We want to replace from `<div class="pricing-section reveal-up" id="bang-gia" ...>`
    // to the end of `<div class="pricing-grid-v2">...</div>`
    // Wait, the best way is to find `<div class="pricing-section reveal-up" id="bang-gia"`
    // and find the next `<!-- Sacombank installment banner -->` or `<!-- ══════════════════════════════════════════`
    
    let startIndex = content.indexOf('<div class="pricing-section reveal-up" id="bang-gia"');
    if (startIndex === -1) {
        console.log('Could not find pricing section in ' + filePath);
        return;
    }
    
    let endIndex = content.indexOf('<!-- Sacombank installment banner -->', startIndex);
    if (endIndex === -1) {
        console.log('Could not find Sacombank banner in ' + filePath);
        return;
    }
    
    let replacement = getHtml(title, stdChf, stdVnd, hqChf, hqVnd);
    
    let newContent = content.substring(0, startIndex) + replacement + '\n                    ' + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated ' + filePath);
}

processFile('e:\\landingpage-main\\landingpage-main\\emba.html', 'EMBA Swiss UMEF', '3.120', '102.960.000', '5.120', '168.960.000');
processFile('e:\\landingpage-main\\landingpage-main\\index.html', 'MBA Swiss UMEF', '4.020', '132.660.000', '5.120', '168.960.000');
