import { useAuth } from "@/contexts/AuthContext";
import { usePageContent } from "@/hooks/usePageContent";

export function usePrintHeaderFooter() {
  const { user } = useAuth();
  const { getSectionContent } = usePageContent();
  const headerData = getSectionContent<any>("header");
  const footerData = getSectionContent<any>("footer");

  const siteLogoUrl = headerData?.logoUrl || '';
  const siteName = headerData?.companyName || footerData?.companyName || 'FishCare';
  const sitePhone = footerData?.phone || '+880 1978 865277';
  const siteEmail = footerData?.email || 'support@fishcare.com.bd';
  const siteAddress1 = footerData?.address_line1 || 'Manirampur, Jashore';
  const siteAddress2 = footerData?.address_line2 || 'Khulna, Bangladesh';
  const siteUrl = window.location.origin;

  const userName = user?.full_name || user?.email || '';
  const userMobile = user?.mobile || '';
  const userAddress = [user?.village, user?.upazila, user?.district, user?.division].filter(Boolean).join(', ');

  const getPrintStyles = () => `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Noto Sans Bengali',sans-serif;padding:0;color:#333}
    .print-header{display:flex;align-items:center;gap:16px;padding:20px 30px;border-bottom:3px solid #7c3aed}
    .print-header img{width:60px;height:60px;object-fit:contain;border-radius:8px}
    .print-header .logo-placeholder{width:60px;height:60px;background:linear-gradient(135deg,#7c3aed,#06b6d4);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:bold}
    .print-header .user-info{flex:1}
    .print-header .user-info h2{font-size:18px;color:#7c3aed;margin-bottom:2px}
    .print-header .user-info p{font-size:12px;color:#666}
    .print-header .report-title{text-align:right}
    .print-header .report-title h1{font-size:20px;color:#7c3aed}
    .print-header .report-title p{font-size:11px;color:#888}
    .content{padding:20px 30px}
    table{width:100%;border-collapse:collapse;margin-top:15px;font-size:13px}
    th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left}
    th{background:#f3e8ff;color:#6b21a8;font-weight:600}
    .income{color:#16a34a}.expense{color:#dc2626}
    .total{font-weight:bold;font-size:16px;text-align:right;margin-top:15px;padding:10px;background:#f8f5ff;border-radius:8px}
    .print-footer{margin-top:30px;padding:15px 30px;border-top:2px solid #7c3aed;background:#f8f5ff;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#666}
    .print-footer .left p{margin-bottom:2px}
    .print-footer .right{text-align:right}
    .print-footer .site-name{font-weight:700;color:#7c3aed;font-size:13px}
    .print-footer .promo{font-size:10px;color:#888;margin-top:4px}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;

  const getHeaderHtml = (reportTitle: string) => `
    <div class="print-header">
      ${siteLogoUrl ? `<img src="${siteLogoUrl}" alt="${siteName}"/>` : `<div class="logo-placeholder">🐟</div>`}
      <div class="user-info">
        <h2>${userName}</h2>
        ${userMobile ? `<p>📱 ${userMobile}</p>` : ''}
        ${userAddress ? `<p>📍 ${userAddress}</p>` : ''}
      </div>
      <div class="report-title">
        <h1>${reportTitle}</h1>
        <p>তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
      </div>
    </div>
  `;

  const getFooterHtml = () => `
    <div class="print-footer">
      <div class="left">
        <p>📍 ${siteAddress1}, ${siteAddress2}</p>
        <p>📱 ${sitePhone} | ✉️ ${siteEmail}</p>
      </div>
      <div class="right">
        <div class="site-name">${siteName}</div>
        <p>🌐 ${siteUrl}</p>
        <div class="promo">মাছ চাষিদের সেবায় নিবেদিত | ${siteName}</div>
      </div>
    </div>
  `;

  const printReport = (reportTitle: string, bodyContent: string) => {
    const html = `<html><head><title>${reportTitle}</title><style>${getPrintStyles()}</style></head><body>
      ${getHeaderHtml(reportTitle)}
      <div class="content">${bodyContent}</div>
      ${getFooterHtml()}
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  return { printReport, siteLogoUrl, siteName, sitePhone, siteEmail, siteAddress1, siteAddress2, siteUrl, userName, userMobile, userAddress };
}
