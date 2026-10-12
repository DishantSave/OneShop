import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../services/order.service';
import { Order } from '../models/order.model';

export interface InvoiceData {
  orderIds: string[];
  orderDate: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingState?: string;
  paymentMethod: string;
  paymentStatus: string;
  otpVerified: boolean;
  companyCode: string;
  companyName: string;
  storeName: string;
  storeCode: string;
  items: {
    itemNumber: string;
    itemName: string;
    sizeCode: string;
    companyCode: string;
    storeName?: string;
    quantity: number;
    unitPrice: number;
    tax: number;
    shippingCost: number;
    discount: number;
    totalPrice: number;
  }[];
  subTotal: number;
  discount: number;
  tax: number;
  otherTax: number;
  shippingCost: number;
  platformFee: number;
  totalAmount: number;
  deliveryPartner?: string;
  isFreeShipping?: boolean;
}

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-success.html',
  styles: [`
    @media print {
      body * {
        visibility: hidden !important;
      }
      .printable-invoice, .printable-invoice * {
        visibility: visible !important;
      }
      .printable-invoice {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 1.5rem !important;
        box-shadow: none !important;
        border: none !important;
      }
      .no-print, header, nav, aside, app-navbar, app-sidebar {
        display: none !important;
      }
    }
  `]
})
export class OrderSuccess implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  invoice = signal<InvoiceData | null>(null);
  loading = signal<boolean>(false);
  isNewOrder = signal<boolean>(false);
  isGeneratingPdf = signal<boolean>(false);

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const stateData = (nav?.extras?.state as any)?.invoiceData || history.state?.invoiceData;

    if (stateData) {
      this.invoice.set(stateData);
      const isFromCheckout = !!stateData.otpVerified && !this.route.snapshot.queryParams['orderId'];
      this.isNewOrder.set(isFromCheckout);
      if (this.route.snapshot.queryParams['download'] === '1') {
        setTimeout(() => this.downloadPdf(), 500);
      }
    } else {
      // Try to load via query params if available
      this.route.queryParams.subscribe(async params => {
        const orderId = params['orderId'];
        const companyCode = params['companyCode'];
        if (orderId && companyCode) {
          this.isNewOrder.set(false);
          await this.loadOrderInvoice(companyCode, orderId);
          if (params['download'] === '1') {
            setTimeout(() => this.downloadPdf(), 600);
          }
        }
      });
    }
  }

  async downloadPdf() {
    const element = document.querySelector('.printable-invoice') as HTMLElement;
    if (!element) {
      window.print();
      return;
    }

    this.isGeneratingPdf.set(true);

    try {
      // @ts-ignore
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const orderRef = this.invoice()?.orderIds?.join('-') || 'Order';
      const opt: any = {
        margin: 10,
        filename: `Invoice-${orderRef}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Error generating PDF via html2pdf, falling back to window.print():', err);
      window.print();
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }

  async loadOrderInvoice(companyCode: string, orderId: string) {
    this.loading.set(true);
    try {
      const order = await this.orderService.getById(companyCode, orderId);
      if (order) {
        this.invoice.set({
          orderIds: [order.orderId],
          orderDate: order.orderDate || new Date().toISOString(),
          customerName: order.customerName || 'Valued Customer',
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          shippingAddress: order.shippingAddress || 'N/A',
          shippingState: order.shippingState,
          paymentMethod: 'Prepaid (OTP Verified Simulation)',
          paymentStatus: order.paymentStatus || 'Paid',
          otpVerified: true,
          companyCode: order.companyCode,
          companyName: order.companyName || order.companyCode,
          storeName: order.locationName || order.locationCode,
          storeCode: order.locationCode,
          items: (order.items || []).map(it => ({
            itemNumber: it.itemNumber,
            itemName: it.itemName,
            sizeCode: it.sizeCode,
            companyCode: order.companyCode,
            storeName: order.locationName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            tax: it.tax || 0,
            shippingCost: it.shippingCost || 0,
            discount: it.discount || 0,
            totalPrice: it.totalPrice || (it.quantity * it.unitPrice)
          })),
          subTotal: order.subTotal,
          discount: order.discount,
          tax: order.tax,
          otherTax: order.otherTax || 0,
          shippingCost: order.shippingCost,
          platformFee: order.platformFee || 0.50,
          totalAmount: order.totalAmount,
          deliveryPartner: order.deliveryPartner,
          isFreeShipping: order.shippingCost === 0 && order.subTotal >= 500
        });
      }
    } catch (e) {
      console.error('Failed to load invoice from API', e);
    } finally {
      this.loading.set(false);
    }
  }

  printInvoice() {
    window.print();
  }
}
