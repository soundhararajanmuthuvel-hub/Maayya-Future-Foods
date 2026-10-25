import React from 'react';
import { Modal } from './Modal';
import { Invoice } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import { Printer, Download, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InvoiceBrandLogos } from './InvoiceBrandLogos';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  const { addToast, companyInfo } = useApp();

  if (!invoice) return null;

  const handlePrintInvoice = () => {
    // Add class to body to isolate print view to .invoice-print-sheet
    document.body.classList.add('printing-invoice');
    
    // Trigger browser print dialog
    window.print();

    // Clean up class after dialog closes or prints
    setTimeout(() => {
      document.body.classList.remove('printing-invoice');
    }, 1000);

    addToast({
      type: 'info',
      title: 'Print Dialog Opened',
      message: `System print dialog triggered for ${invoice.invoiceNumber}. Select 'Save as PDF' or physical printer.`,
    });
  };

  const handleDownloadPdf = () => {
    try {
      const invoiceElement = document.getElementById('printable-invoice-content');
      if (!invoiceElement) {
        throw new Error('Invoice container element not found.');
      }

      // Generate a standalone HTML document specifically optimized for A4 download & printing
      const invoiceHtml = invoiceElement.outerHTML;
      const printWindow = window.open('', '_blank', 'width=850,height=1000');
      
      if (!printWindow) {
        // Pop-up was blocked, fallback to standard print
        handlePrintInvoice();
        return;
      }

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>Invoice-${invoice.invoiceNumber}</title>
            <style>
              @page {
                size: A4;
                margin: 12mm 15mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #0f172a;
                background: #ffffff;
                margin: 0;
                padding: 0;
                font-size: 11pt;
                line-height: 1.35;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 6px 8px;
              }
              th {
                background-color: #f8fafc;
                font-weight: 700;
              }
              .border { border: 1px solid #e2e8f0; }
              .border-b { border-bottom: 1px solid #cbd5e1; }
              .border-t { border-top: 1px solid #cbd5e1; }
              .p-4 { padding: 1rem; }
              .p-6 { padding: 1.5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mt-4 { margin-top: 1rem; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .items-start { align-items: flex-start; }
              .gap-4 { gap: 1rem; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${invoiceHtml}
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

      addToast({
        type: 'success',
        title: 'Invoice PDF Ready',
        message: `Opening high-resolution A4 print document for ${invoice.invoiceNumber}. Click 'Save as PDF' to download.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'PDF Generation Failed',
        message: err?.message || 'Could not prepare invoice document.',
      });
    }
  };

  return (
    <Modal
      isOpen={!!invoice}
      onClose={onClose}
      title={`TAX INVOICE — ${invoice.invoiceNumber}`}
      subtitle={`Generated on ${formatDate(invoice.date)} · ${invoice.type}`}
      maxWidth="3xl"
      footer={
        <>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
            title="Download high-resolution A4 PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrintInvoice}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
            title="Open browser print dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>
        </>
      }
    >
      {/* Printable Invoice Sheet with Mobile Scroll Protection */}
      <div className="overflow-x-auto -mx-3 sm:mx-0 p-1">
        <div
          id="printable-invoice-content"
          className="invoice-print-sheet bg-white border border-slate-300 p-4 sm:p-6 rounded text-slate-800 font-sans text-xs print:p-0 print:border-none min-w-[560px] sm:min-w-full"
        >
        {/* Dynamic Brand Logos at Top of Invoice (Heritage / Hangyo / Mixed / Future Brands) */}
        <div className="pb-3 mb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <InvoiceBrandLogos
            items={invoice.items}
            brandLogos={invoice.brandLogos}
            showLabel={true}
          />
          <div className="text-right sm:text-right shrink-0">
            <span className="text-[10px] font-mono text-slate-500 block">
              TAX INVOICE · GSTIN: <strong className="text-slate-800">{companyInfo.gstin}</strong>
            </span>
          </div>
        </div>

        {/* Distributor / Legal Seller Header Block */}
        <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-4 gap-4">
          <div className="flex items-start gap-3.5">
            <img
              src={companyInfo.logoUrl || '/assets/maayya-future-foods-logo.png'}
              alt={`${companyInfo.name} logo`}
              className="h-16 w-auto max-w-[85px] object-contain shrink-0"
              style={{ objectFit: 'contain' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-950 font-serif">
                  {companyInfo.name.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold">
                  {companyInfo.city.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-800 font-semibold text-[11px] mt-0.5">
                {companyInfo.city}, {companyInfo.state || 'Tamil Nadu'} {companyInfo.pincode && `· PIN: ${companyInfo.pincode}`} · Phone: {companyInfo.phone}
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                {companyInfo.address}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-600 mt-1">
                {companyInfo.gstin && <span><strong>GSTIN:</strong> {companyInfo.gstin}</span>}
                {companyInfo.fssai && <span><strong>FSSAI Lic:</strong> {companyInfo.fssai}</span>}
                {companyInfo.financialYear && <span><strong>FY:</strong> {companyInfo.financialYear}</span>}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block px-2.5 py-1 text-xs font-bold text-slate-900 border border-slate-900 uppercase tracking-widest bg-slate-50">
              Tax Invoice
            </span>
            <div className="mt-2 text-right">
              <div className="font-mono font-bold text-sm text-slate-900">{invoice.invoiceNumber}</div>
              <div className="text-slate-500 text-[11px]">Date: {formatDate(invoice.date)}</div>
              <div className="text-slate-500 text-[11px]">Due: {formatDate(invoice.dueDate)}</div>
            </div>
          </div>
        </div>

        {/* Bill To & Dispatch Details */}
        <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 bg-slate-50/50 mb-4 rounded">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Billed To (Consignee)
            </span>
            <p className="font-bold text-slate-900">{invoice.shopName}</p>
            {invoice.shopAddress && <p className="text-slate-600">{invoice.shopAddress}</p>}
            {invoice.shopGstin && (
              <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                GSTIN: <strong>{invoice.shopGstin}</strong>
              </p>
            )}
            <p className="text-slate-500 text-[11px] mt-0.5">Place of Supply: Tamil Nadu (33)</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Payment & Logistics
            </span>
            <div className="space-y-0.5 text-slate-700">
              <p>Type: <span className="font-medium">{invoice.type}</span></p>
              <p>Payment Mode: <span className="font-medium">{invoice.paymentMode}</span></p>
              <p>Payment Status:{' '}
                <span className={`font-semibold ${
                  invoice.paymentStatus === 'Paid' ? 'text-emerald-700' :
                  invoice.paymentStatus === 'Cancelled' ? 'text-rose-700 line-through' :
                  'text-amber-700'
                }`}>
                  {invoice.paymentStatus}
                </span>
              </p>
              {invoice.notes && <p className="text-slate-500 italic">Notes: {invoice.notes}</p>}
            </div>
          </div>
        </div>

        {/* Cancellation Notice if applicable */}
        {invoice.paymentStatus === 'Cancelled' && (
          <div className="border border-rose-300 bg-rose-50 text-rose-800 p-2.5 rounded mb-4 text-xs">
            <span className="font-bold uppercase tracking-wider block text-[11px]">Invoice Reversal Recorded</span>
            <p>Reason: {invoice.cancellationReason}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Cancelled on {invoice.cancelledAt} by {invoice.cancelledBy}
            </p>
          </div>
        )}

        {/* Line Items Table */}
        <table className="w-full text-left border-collapse mb-4 border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
              <th className="p-2 w-8">#</th>
              <th className="p-2">Item Description</th>
              <th className="p-2">Batch / Exp</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Rate</th>
              <th className="p-2 text-center">GST %</th>
              <th className="p-2 text-right">Tax (₹)</th>
              <th className="p-2 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="p-2 text-slate-500 font-mono">{idx + 1}</td>
                <td className="p-2">
                  <div className="font-medium text-slate-900">{item.productName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Brand: {item.brand}</div>
                </td>
                <td className="p-2 font-mono text-[11px] text-slate-600">
                  <div>{item.batchNumber}</div>
                  <div className="text-[10px] text-slate-400">Exp: {item.expiryDate}</div>
                </td>
                <td className="p-2 text-right font-mono font-medium">
                  {item.qty} {item.unit}
                </td>
                <td className="p-2 text-right font-mono">{formatINR(item.unitPrice, true)}</td>
                <td className="p-2 text-center font-mono">{item.gstRate}%</td>
                <td className="p-2 text-right font-mono">{formatINR(item.taxAmount, true)}</td>
                <td className="p-2 text-right font-mono font-bold text-slate-900">
                  {formatINR(item.totalAmount, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculation Summary & Bank Details */}
        <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-200">
          <div className="border border-slate-200 p-3 rounded bg-slate-50/40 text-[11px] space-y-1">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Bank Settlement Details
            </span>
            <p><strong>Bank:</strong> {companyInfo.bankName}</p>
            <p><strong>A/C Name:</strong> {companyInfo.name} Pvt Ltd</p>
            <p className="font-mono"><strong>A/C No:</strong> {companyInfo.accountNumber}</p>
            <p className="font-mono"><strong>IFSC:</strong> {companyInfo.ifscCode}</p>
            <p><strong>UPI ID:</strong> {companyInfo.upiId}</p>
            <div className="mt-2 text-slate-500 text-[10px]">
              * Subject to {companyInfo.city} jurisdiction. Goods once sold cannot be returned without prior cold-chain quality audit.
            </div>
          </div>

          <div className="space-y-1.5 text-right font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Excl. Tax):</span>
              <span>{formatINR(invoice.subtotal, true)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CGST (Central Tax):</span>
              <span>{formatINR(invoice.cgst, true)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST (State Tax):</span>
              <span>{formatINR(invoice.sgst, true)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Special Discount:</span>
                <span>-{formatINR(invoice.discountAmount, true)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-950 pt-2 border-t border-slate-300">
              <span>Grand Total:</span>
              <span>{formatINR(invoice.grandTotal, true)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Amount Paid:</span>
              <span className="text-emerald-700">{formatINR(invoice.paidAmount, true)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800">
              <span>Balance Due:</span>
              <span className={invoice.balanceAmount > 0 ? 'text-rose-700' : 'text-slate-700'}>
                {formatINR(invoice.balanceAmount, true)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-6 pt-8 mt-6 border-t border-slate-200 text-[11px] text-slate-600">
          <div>
            <p className="font-medium">Receiver's Seal & Signature</p>
            <div className="h-10 mt-2 border-b border-dashed border-slate-300 w-44"></div>
          </div>
          <div className="text-right">
            <p className="font-medium">For {companyInfo.name}</p>
            <div className="h-10 mt-2 flex items-end justify-end">
              <span className="font-bold text-slate-900 font-serif">[Authorized Signatory]</span>
            </div>
          </div>
        </div>

        {/* System & Software Attribution Footnote */}
        <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>This is an authentic computer-generated invoice issued by {companyInfo.name}.</span>
          <span>Software developed by MSR Solutions</span>
        </div>
      </div>
    </div>
    </Modal>
  );
};
