import { Component, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  totalSeconds: number;
  category: 'ITEMS' | 'ORDERS' | 'INVENTORY' | 'DISCOUNTS';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnailIcon: string;
  thumbnailColor: string;
  audioUrl: string;
  actionLink: string;
  actionLabel: string;
  steps: string[];
  chapters: { time: string; title: string; second: number }[];
  cues: { start: number; end: number; text: string }[];
}

@Component({
  selector: 'app-tutorials-portal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tutorials-portal.html'
})
export class TutorialsPortal implements AfterViewInit, OnDestroy {
  @ViewChild('videoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('audioPlayer') audioRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('playerContainer') playerContainerRef!: ElementRef<HTMLDivElement>;

  selectedCategory = signal<string>('ALL');
  isPlaying = signal<boolean>(false);
  playbackSpeed = signal<number>(1);
  currentTime = signal<number>(0); // in seconds
  isMuted = signal<boolean>(false);
  volume = signal<number>(0.9);
  captionsEnabled = signal<boolean>(true);
  isRecording = signal<boolean>(false);
  isFullscreen = signal<boolean>(false);
  currentSubtitle = signal<string>('Press Play to start the video tutorial with AI voice-over narration.');

  private animationFrameId: number | null = null;
  private speechUtterance: SpeechSynthesisUtterance | null = null;
  private lastSpokenCueIndex: number = -1;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  tutorials: TutorialVideo[] = [
    {
      id: 'create-item',
      title: 'How to Create Items with Dual Wholesale & Retail Pricing',
      description: 'Master the Item Master workflow: setup item name, SKU, dual pricing (b2cPrice & b2bPrice), wholesale MOQ threshold (b2bMinQuantity), and size/colour variants.',
      duration: '00:42',
      totalSeconds: 42,
      category: 'ITEMS',
      difficulty: 'Beginner',
      thumbnailIcon: 'pi pi-box',
      thumbnailColor: '#05517e',
      audioUrl: 'tutorials/tutorial-item-creation.wav',
      actionLink: '/dashboard/items/new',
      actionLabel: 'Open Item Creator',
      steps: [
        'Navigate to Items tab and click "+ Add New Item".',
        'Enter Item Number, Product Name, Category, and assign company code.',
        'Configure Dual Pricing: Set Retail Price ($45.00) and Wholesale B2B Price ($28.00).',
        'Define Minimum Order Quantity (MOQ = 10) for automated wholesale switching.',
        'Configure Colour and Size variants to populate stock matrix, then click "Save Item".'
      ],
      chapters: [
        { time: '00:00', title: 'Navigation to Items Master', second: 0 },
        { time: '00:08', title: 'Basic Info & Identifiers', second: 8 },
        { time: '00:18', title: 'Dual Pricing & Wholesale MOQ', second: 18 },
        { time: '00:30', title: 'Colour & Size Matrix', second: 30 },
        { time: '00:36', title: 'Save & Publish Product', second: 36 }
      ],
      cues: [
        { start: 0, end: 7, text: 'Welcome to the OneShop Tutorial. In this guide, you will learn how to create items with dual wholesale and retail pricing.' },
        { start: 7, end: 17, text: 'First, open the Items tab from your dashboard and click the Add New Item button. Enter the Item Number and Product Title.' },
        { start: 17, end: 29, text: 'Now configure Dual Channel Pricing. Set the Retail Price to $45.00, the Wholesale Price to $28.00, and set the Minimum Quantity to 10 units.' },
        { start: 29, end: 36, text: 'Whenever a customer orders 10 or more units, the wholesale price tier activates automatically. Next, setup color and size variants.' },
        { start: 36, end: 42, text: 'Finally, click Save Item. Your product is now live across retail and wholesale storefronts!' }
      ]
    },
    {
      id: 'process-orders',
      title: 'How to Process, Fulfill & Print Shipping Labels for Orders',
      description: 'Step-by-step masterclass on fulfilling orders: acknowledging orders, selecting fulfillment warehouse vs store, generating 4x6" shipping labels, updating tracking numbers, and notifying customers.',
      duration: '00:40',
      totalSeconds: 40,
      category: 'ORDERS',
      difficulty: 'Intermediate',
      thumbnailIcon: 'pi pi-truck',
      thumbnailColor: '#10b981',
      audioUrl: 'tutorials/tutorial-order-fulfillment.wav',
      actionLink: '/dashboard/orders',
      actionLabel: 'Go to Orders Screen',
      steps: [
        'Open Orders screen and locate confirmed orders.',
        'Click "[Ship & Label]" on an acknowledged order to open the Dispatch console.',
        'Select the Fulfillment Facility (Warehouse for wholesale bulk orders or Store for retail).',
        'Assign delivery partner and generate AWB Tracking Number with live link.',
        'Generate printable 4x6" thermal shipping barcode label and confirm dispatch.'
      ],
      chapters: [
        { time: '00:00', title: 'Review Incoming Orders', second: 0 },
        { time: '00:08', title: 'Open Fulfillment Console', second: 8 },
        { time: '00:18', title: 'Fulfillment Facility Allocation', second: 18 },
        { time: '00:28', title: 'Thermal 4x6" Barcode Label', second: 28 },
        { time: '00:35', title: 'Confirm Dispatch & Alerts', second: 35 }
      ],
      cues: [
        { start: 0, end: 8, text: 'In this tutorial, you will learn how to fulfill orders and generate thermal shipping labels in OneShop.' },
        { start: 8, end: 18, text: 'From the Orders screen, review incoming confirmed orders. Click the Ship and Label button to open the fulfillment console.' },
        { start: 18, end: 28, text: 'For large wholesale orders, allocate your Central Warehouse and select Road Freight. For retail, select your Store.' },
        { start: 28, end: 35, text: 'Click Generate AWB to produce a standard 4x6 inch thermal barcode shipping label complete with consignee routing details.' },
        { start: 35, end: 40, text: 'Click Print Label, then click Confirm Dispatch. The customer immediately receives automated tracking alerts!' }
      ]
    },
    {
      id: 'inventory-warehouses',
      title: 'Mastering Stock Allocation Across Warehouses & Retail Stores',
      description: 'Learn how to maintain optimal stock levels: tracking quantity on hand, available vs allocated stock, reorder levels, and replenishing critical low-stock items before stockouts occur.',
      duration: '00:32',
      totalSeconds: 32,
      category: 'INVENTORY',
      difficulty: 'Intermediate',
      thumbnailIcon: 'pi pi-database',
      thumbnailColor: '#6366f1',
      audioUrl: 'tutorials/tutorial-inventory-allocation.wav',
      actionLink: '/dashboard/inventory',
      actionLabel: 'Manage Inventory',
      steps: [
        'Open Inventory screen to inspect quantity on hand across all facilities.',
        'Filter by Warehouse vs Store to verify bulk storage distribution.',
        'Identify items with low stock where quantityOnHand <= reorderLevel.',
        'Perform stock adjustments or transfers to balance store display units and warehouse reserves.'
      ],
      chapters: [
        { time: '00:00', title: 'Live Stock Architecture', second: 0 },
        { time: '00:10', title: 'Detecting Low Stock Alerts', second: 10 },
        { time: '00:20', title: 'Warehouse to Store Transfer', second: 20 },
        { time: '00:27', title: 'Real-Time Balance Update', second: 27 }
      ],
      cues: [
        { start: 0, end: 10, text: 'Welcome to the OneShop Inventory Allocation guide. Click Inventory from the sidebar to inspect real-time stock on hand.' },
        { start: 10, end: 20, text: 'Review the low stock alerts highlighted in amber and red when available units fall below reorder thresholds.' },
        { start: 20, end: 27, text: 'Initiate a quick Stock Transfer from your Central Warehouse to replenish your flagship retail store.' },
        { start: 27, end: 32, text: 'Confirm the transfer quantity. Your multi-facility stock ledger updates in real time!' }
      ]
    },
    {
      id: 'discounts-taxes',
      title: 'Configuring Promo Codes, Festive Discounts & State Taxes',
      description: 'Setup promotional coupon vouchers (like DIWALI, WELCOME10), configure percentage or flat dollar savings, manage state-level GST/VAT tax rates, and setup delivery carrier shipping rules.',
      duration: '00:30',
      totalSeconds: 30,
      category: 'DISCOUNTS',
      difficulty: 'Advanced',
      thumbnailIcon: 'pi pi-percentage',
      thumbnailColor: '#f59e0b',
      audioUrl: 'tutorials/tutorial-discounts-taxes.wav',
      actionLink: '/dashboard/masters/discounts',
      actionLabel: 'Configure Promo Codes',
      steps: [
        'Navigate to Masters -> Promo Codes.',
        'Click "+ New Promo Code" and enter Code (e.g. DIWALI).',
        'Set Discount Type (Fixed Amount or Percentage) and Minimum Order Amount.',
        'Configure start and expiry dates, then activate the voucher.',
        'Review checkout subtotal calculation and state GST tax rules.'
      ],
      chapters: [
        { time: '00:00', title: 'Promo Codes Master', second: 0 },
        { time: '00:10', title: 'Create Coupon Voucher', second: 10 },
        { time: '00:20', title: 'Checkout Discount & Taxes', second: 20 },
        { time: '00:26', title: 'Savings Verification', second: 26 }
      ],
      cues: [
        { start: 0, end: 10, text: 'In this tutorial, we will configure promotional discount vouchers and state tax calculations. Open Masters, then click Promo Codes.' },
        { start: 10, end: 20, text: 'Click New Promo Code. Enter the coupon code, such as DIWALI, select a 15% discount, and set the minimum order threshold.' },
        { start: 20, end: 26, text: 'When buyers checkout, the system validates the cart subtotal and applies the exact discount with tax breakdown.' },
        { start: 26, end: 30, text: 'Your festive promotional campaign is now active across all storefronts!' }
      ]
    }
  ];

  selectedTutorial = signal<TutorialVideo>(this.tutorials[0]);

  ngAfterViewInit() {
    this.initCanvas();
    this.drawFrame(0);
  }

  ngOnDestroy() {
    this.stopPlayback();
    if (this.speechUtterance && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  selectTutorial(tut: TutorialVideo) {
    this.stopPlayback();
    this.selectedTutorial.set(tut);
    this.currentTime.set(0);
    this.lastSpokenCueIndex = -1;
    this.currentSubtitle.set(tut.cues[0]?.text || 'Press Play to start.');

    if (this.audioRef?.nativeElement) {
      this.audioRef.nativeElement.src = tut.audioUrl;
      this.audioRef.nativeElement.currentTime = 0;
    }

    setTimeout(() => {
      this.drawFrame(0);
      this.playVideo();
    }, 50);
  }

  togglePlay() {
    if (this.isPlaying()) {
      this.pauseVideo();
    } else {
      this.playVideo();
    }
  }

  playVideo() {
    this.isPlaying.set(true);

    // Audio Playback
    if (this.audioRef?.nativeElement) {
      const audio = this.audioRef.nativeElement;
      audio.muted = this.isMuted();
      audio.volume = this.volume();
      audio.playbackRate = this.playbackSpeed();
      audio.currentTime = this.currentTime();
      audio.play().catch(() => {
        // Fallback: If audio file not found or browser blocked, use Web Speech API
        this.speakCurrentCue();
      });
    } else {
      this.speakCurrentCue();
    }

    this.startAnimationLoop();
  }

  pauseVideo() {
    this.isPlaying.set(false);
    if (this.audioRef?.nativeElement) {
      this.audioRef.nativeElement.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stopPlayback() {
    this.pauseVideo();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  seek(second: number) {
    const total = this.selectedTutorial().totalSeconds;
    const clamped = Math.max(0, Math.min(total, second));
    this.currentTime.set(clamped);
    this.lastSpokenCueIndex = -1;

    if (this.audioRef?.nativeElement) {
      this.audioRef.nativeElement.currentTime = clamped;
    }

    this.updateSubtitle(clamped);
    this.drawFrame(clamped);

    if (this.isPlaying()) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      this.speakCurrentCue();
    }
  }

  onTimelineScrub(event: MouseEvent) {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const targetSecond = ratio * this.selectedTutorial().totalSeconds;
    this.seek(targetSecond);
  }

  toggleSpeed() {
    const speeds = [1, 1.25, 1.5];
    const curr = this.playbackSpeed();
    const next = speeds[(speeds.indexOf(curr) + 1) % speeds.length];
    this.playbackSpeed.set(next);

    if (this.audioRef?.nativeElement) {
      this.audioRef.nativeElement.playbackRate = next;
    }
  }

  toggleMute() {
    const next = !this.isMuted();
    this.isMuted.set(next);
    if (this.audioRef?.nativeElement) {
      this.audioRef.nativeElement.muted = next;
    }
  }

  toggleCaptions() {
    this.captionsEnabled.update(v => !v);
  }

  toggleFullscreen() {
    const el = this.playerContainerRef?.nativeElement;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => this.isFullscreen.set(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => this.isFullscreen.set(false)).catch(() => { });
    }
  }

  jumpToChapter(chapter: { time: string; title: string; second: number }) {
    this.seek(chapter.second);
    if (!this.isPlaying()) {
      this.playVideo();
    }
  }

  filteredTutorials() {
    const cat = this.selectedCategory();
    if (cat === 'ALL') return this.tutorials;
    return this.tutorials.filter(t => t.category === cat);
  }

  // --- Animation & Rendering Loop ---

  private lastTimestamp = 0;

  private startAnimationLoop() {
    this.lastTimestamp = performance.now();
    const loop = (now: number) => {
      if (!this.isPlaying()) return;

      const dt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;

      let nextTime = this.currentTime() + dt * this.playbackSpeed();

      // If audio player is running, synchronize with audio.currentTime
      if (this.audioRef?.nativeElement && !this.audioRef.nativeElement.paused && !isNaN(this.audioRef.nativeElement.currentTime)) {
        nextTime = this.audioRef.nativeElement.currentTime;
      }

      const total = this.selectedTutorial().totalSeconds;
      if (nextTime >= total) {
        nextTime = total;
        this.currentTime.set(nextTime);
        this.drawFrame(nextTime);
        this.pauseVideo();
        return;
      }

      this.currentTime.set(nextTime);
      this.updateSubtitle(nextTime);
      this.drawFrame(nextTime);

      this.animationFrameId = requestAnimationFrame(loop);
    };

    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateSubtitle(sec: number) {
    const cues = this.selectedTutorial().cues;
    const matchIdx = cues.findIndex(c => sec >= c.start && sec <= c.end);
    if (matchIdx !== -1) {
      this.currentSubtitle.set(cues[matchIdx].text);
      if (matchIdx !== this.lastSpokenCueIndex && this.isPlaying()) {
        this.lastSpokenCueIndex = matchIdx;
        // If audio file isn't playing (e.g. muted or failed), use Web Speech API
        if (!this.audioRef?.nativeElement || this.audioRef.nativeElement.paused) {
          this.speakCue(cues[matchIdx].text);
        }
      }
    }
  }

  private speakCurrentCue() {
    if (this.isMuted()) return;
    const cues = this.selectedTutorial().cues;
    const sec = this.currentTime();
    const match = cues.find(c => sec >= c.start && sec <= c.end);
    if (match) {
      this.speakCue(match.text);
    }
  }

  private speakCue(text: string) {
    if (!('speechSynthesis' in window) || this.isMuted()) return;
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = this.playbackSpeed() * 0.95;
    utt.volume = this.volume();

    // Prefer clear English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Zira')));
    if (preferred) utt.voice = preferred;

    this.speechUtterance = utt;
    window.speechSynthesis.speak(utt);
  }

  // --- HTML5 Canvas Video Rendering Engine (1280 x 720 HD) ---

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    canvas.width = 1280;
    canvas.height = 720;
  }

  private drawFrame(sec: number) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tutId = this.selectedTutorial().id;
    const W = 1280;
    const H = 720;

    // 1. Clear background
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, W, H);

    // 2. Draw Simulated Desktop Window Chrome
    this.drawDesktopWindowChrome(ctx, W, H);

    // 3. Draw OneShop Layout Shell (Sidebar & Header)
    this.drawOneShopShell(ctx, tutId, W, H);

    // 4. Draw Specific Tutorial Scenario
    if (tutId === 'create-item') {
      this.renderItemCreationScene(ctx, sec);
    } else if (tutId === 'process-orders') {
      this.renderOrderFulfillmentScene(ctx, sec);
    } else if (tutId === 'inventory-warehouses') {
      this.renderInventoryScene(ctx, sec);
    } else {
      this.renderDiscountsScene(ctx, sec);
    }

    // 5. Draw Voice Activity Waveform
    this.drawVoiceWaveform(ctx, W - 210, 48, this.isPlaying() && !this.isMuted(), sec);

    // 6. Draw Closed Captions Overlay
    if (this.captionsEnabled()) {
      this.drawClosedCaptions(ctx, this.currentSubtitle(), W, H);
    }
  }

  // Window frame & address bar
  private drawDesktopWindowChrome(ctx: CanvasRenderingContext2D, W: number, H: number) {
    // Window header bar
    ctx.fillStyle = '#111c38';
    ctx.fillRect(0, 0, W, 40);

    // Traffic light dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(22, 20, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(40, 20, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(58, 20, 6, 0, Math.PI * 2); ctx.fill();

    // Browser address bar
    ctx.fillStyle = '#1a274c';
    this.roundRect(ctx, 160, 8, W - 340, 24, 6);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('🔒 https://oneshop.internal/dashboard/portal', 180, 24);

    // HD 1080p Badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillText('1080p 60FPS AI SIMULATOR', W - 160, 24);
  }

  // Main UI Shell
  private drawOneShopShell(ctx: CanvasRenderingContext2D, tutId: string, W: number, H: number) {
    const sidebarW = 210;
    const headerH = 50;

    // Header background
    ctx.fillStyle = '#152243';
    ctx.fillRect(sidebarW, 40, W - sidebarW, headerH);
    ctx.strokeStyle = '#1e2d5a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sidebarW, 40 + headerH);
    ctx.lineTo(W, 40 + headerH);
    ctx.stroke();

    // Header Navigation Tabs
    const tabs = ['Global Products', 'Analytics', 'Tutorials'];
    let tabX = sidebarW + 24;
    tabs.forEach(t => {
      const isActive = t === 'Tutorials';
      ctx.fillStyle = isActive ? '#38bdf8' : '#94a3b8';
      ctx.font = `${isActive ? 'bold' : 'normal'} 13px "Segoe UI", sans-serif`;
      ctx.fillText(t, tabX, 70);
      if (isActive) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(tabX, 86, ctx.measureText(t).width, 3);
      }
      tabX += ctx.measureText(t).width + 28;
    });

    // App Logo in Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText('OneShop', W - 110, 71);

    // Left Sidebar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 40, sidebarW, H - 40);

    // Sidebar Logo / Title
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(32, 68, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('OneShop Portal', 50, 73);

    // Sidebar Items Sequence: Dashboard, Orders, Items, Inventory, Masters, Users, Settings
    const navItems = [
      { label: 'Dashboard', icon: '⊞', key: 'dashboard' },
      { label: 'Orders', icon: '🛒', key: 'orders' },
      { label: 'Items', icon: '📦', key: 'items' },
      { label: 'Inventory', icon: '🗄', key: 'inventory' },
      { label: 'Masters', icon: '⚙', key: 'masters' },
      { label: 'Users', icon: '👥', key: 'users' },
      { label: 'Settings', icon: '🔧', key: 'settings' }
    ];

    let activeKey = 'items';
    if (tutId === 'process-orders') activeKey = 'orders';
    else if (tutId === 'inventory-warehouses') activeKey = 'inventory';
    else if (tutId === 'discounts-taxes') activeKey = 'masters';

    let navY = 110;
    navItems.forEach(item => {
      const isActive = item.key === activeKey;
      if (isActive) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        this.roundRect(ctx, 12, navY - 14, sidebarW - 24, 32, 6);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
      } else {
        ctx.fillStyle = '#94a3b8';
      }
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(`${item.icon}  ${item.label}`, 24, navY + 6);
      navY += 38;
    });

    // Sidebar Bottom: Notifications & Logout
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('🔔 Notifications (3)', 24, H - 55);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('↪ Logout', 24, H - 25);
  }

  // --- SCENE 1: Item Creation with Dual Pricing & MOQ ---
  private renderItemCreationScene(ctx: CanvasRenderingContext2D, sec: number) {
    const W = 1280;
    const stageX = 230;
    const stageY = 105;
    const stageW = W - 250;

    // Stage Header
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('Item Master / Add New Item', stageX, stageY + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('Setup product catalogue with dual wholesale (B2B) & retail (B2C) tier pricing', stageX, stageY + 44);

    // Form Container
    const formY = stageY + 60;
    ctx.fillStyle = '#131e3a';
    this.roundRect(ctx, stageX, formY, stageW, 460, 12);
    ctx.fill();
    ctx.strokeStyle = '#22325c';
    ctx.stroke();

    // Section 1: Basic Information
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('1. Product Identifiers', stageX + 24, formY + 32);

    // Item Number field
    this.drawFormField(ctx, stageX + 24, formY + 48, 260, 'Item Number', sec > 8 ? 'TSHIRT-PRO-2026' : (sec > 5 ? 'TSHIRT-...' : ''), sec >= 5 && sec <= 9);

    // Item Name field
    this.drawFormField(ctx, stageX + 310, formY + 48, 380, 'Product Name', sec > 12 ? 'Heavyweight Cotton Crewneck' : (sec > 9 ? 'Heavyweight...' : ''), sec >= 9 && sec <= 13);

    // Category dropdown
    this.drawFormField(ctx, stageX + 715, formY + 48, 250, 'Category', sec > 15 ? 'Apparel & Textiles ▾' : 'Select Category ▾', false);

    // Section 2: Dual Pricing & Wholesale MOQ (Spotlight when sec >= 17 && sec <= 30)
    const priceY = formY + 130;
    const isSpotlight = sec >= 17 && sec <= 30;

    if (isSpotlight) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      this.roundRect(ctx, stageX + 16, priceY - 10, stageW - 32, 175, 10);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.fillStyle = isSpotlight ? '#38bdf8' : '#e2e8f0';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('2. Dual Channel Pricing & Wholesale MOQ Threshold', stageX + 24, priceY + 16);

    // Retail Price (B2C)
    this.drawFormField(ctx, stageX + 24, priceY + 34, 220, 'Retail Price (B2C)', sec > 20 ? '$45.00' : '', sec >= 18 && sec <= 21);

    // Wholesale Price (B2B)
    this.drawFormField(ctx, stageX + 270, priceY + 34, 220, 'Wholesale Price (B2B)', sec > 23 ? '$28.00' : '', sec >= 21 && sec <= 24);

    // MOQ Threshold (b2bMinQuantity)
    this.drawFormField(ctx, stageX + 515, priceY + 34, 200, 'Wholesale MOQ (Min Qty)', sec > 26 ? '10 Units' : '', sec >= 24 && sec <= 27);

    // Live Savings Callout
    if (sec > 26) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      this.roundRect(ctx, stageX + 735, priceY + 48, 240, 48, 8);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('⚡ Wholesale Activated', stageX + 748, priceY + 68);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('Saves $17.00/unit when qty >= 10', stageY ? stageX + 748 : 0, priceY + 86);
    }

    // Section 3: Colour & Size Variants Matrix
    const varY = priceY + 175;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('3. Variant Matrix (Colour & Size combinations)', stageX + 24, varY + 16);

    const sizes = ['S', 'M', 'L', 'XL'];
    let pillX = stageX + 24;
    sizes.forEach(s => {
      ctx.fillStyle = sec > 30 ? '#05517e' : '#1e293b';
      this.roundRect(ctx, pillX, varY + 30, 48, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText(s, pillX + 17, varY + 49);
      pillX += 60;
    });

    // Save Button
    const btnY = formY + 400;
    ctx.fillStyle = sec >= 37 ? '#10b981' : '#05517e';
    this.roundRect(ctx, stageX + stageW - 190, btnY, 160, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText('✓ Save Item', stageX + stageW - 145, btnY + 25);

    // Success Notification Banner
    if (sec >= 37) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      this.roundRect(ctx, stageX + 24, btnY, 460, 40, 8);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('✓ Item TSHIRT-PRO-2026 published with dual wholesale tier!', stageX + 40, btnY + 25);
    }

    // Animated Mouse Cursor Path
    let curX = 350;
    let curY = 220;
    let isClicking = false;

    if (sec < 6) { curX = 260 + sec * 20; curY = 170; }
    else if (sec >= 6 && sec < 10) { curX = stageX + 120; curY = formY + 70; isClicking = sec > 7 && sec < 8.5; }
    else if (sec >= 10 && sec < 14) { curX = stageX + 420; curY = formY + 70; isClicking = sec > 10.5 && sec < 12; }
    else if (sec >= 14 && sec < 19) { curX = stageX + 750; curY = formY + 70; isClicking = sec > 15 && sec < 16.5; }
    else if (sec >= 19 && sec < 23) { curX = stageX + 100; curY = priceY + 60; isClicking = sec > 19.5 && sec < 21; }
    else if (sec >= 23 && sec < 26) { curX = stageX + 340; curY = priceY + 60; isClicking = sec > 23.5 && sec < 25; }
    else if (sec >= 26 && sec < 31) { curX = stageX + 580; curY = priceY + 60; isClicking = sec > 26.5 && sec < 28; }
    else if (sec >= 31 && sec < 37) { curX = stageX + 100; curY = varY + 45; isClicking = sec > 32 && sec < 33.5; }
    else { curX = stageX + stageW - 110; curY = btnY + 20; isClicking = sec >= 37 && sec <= 38.5; }

    this.drawAnimatedCursor(ctx, curX, curY, isClicking);
  }

  // --- SCENE 2: Order Fulfillment & 4x6" Thermal Shipping Label ---
  private renderOrderFulfillmentScene(ctx: CanvasRenderingContext2D, sec: number) {
    const W = 1280;
    const stageX = 230;
    const stageY = 105;
    const stageW = W - 250;

    // Stage Header
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('Order Management / Fulfill & Dispatch', stageX, stageY + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('Acknowledge order, assign nearest warehouse for wholesale quantity, and print thermal label', stageX, stageY + 44);

    // Modal or Orders Table
    if (sec < 9) {
      // Table view
      ctx.fillStyle = '#131e3a';
      this.roundRect(ctx, stageX, stageY + 65, stageW, 440, 12);
      ctx.fill();

      // Table Header
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(stageX, stageY + 65, stageW, 44);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('ORDER ID', stageX + 24, stageY + 92);
      ctx.fillText('BUYER / STORE', stageX + 160, stageY + 92);
      ctx.fillText('QUANTITY', stageX + 360, stageY + 92);
      ctx.fillText('TOTAL', stageX + 480, stageY + 92);
      ctx.fillText('STATUS', stageX + 600, stageY + 92);
      ctx.fillText('ACTION', stageX + 760, stageY + 92);

      // Order Row (Wholesale)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(stageX, stageY + 115, stageW, 55);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('#ORD-8921', stageX + 24, stageY + 148);

      ctx.fillStyle = '#ffffff';
      ctx.fillText('Apex Retail Corp', stageX + 160, stageY + 148);

      ctx.fillStyle = '#f59e0b';
      ctx.fillText('25 Units (Wholesale)', stageX + 360, stageY + 148);

      ctx.fillStyle = '#ffffff';
      ctx.fillText('$700.00', stageX + 480, stageY + 148);

      // Status Badge
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      this.roundRect(ctx, stageX + 590, stageY + 130, 95, 26, 6);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('Confirmed', stageX + 608, stageY + 147);

      // Action Button [Ship & Label]
      ctx.fillStyle = '#05517e';
      this.roundRect(ctx, stageX + 750, stageY + 128, 120, 30, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('Ship & Label', stageX + 772, stageY + 148);

      this.drawAnimatedCursor(ctx, stageX + 800, stageY + 143, sec >= 7);
    } else {
      // Dispatch Console Modal
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(stageX, stageY + 60, stageW, 470);

      // Modal Card
      const modalW = 860;
      const modalH = 430;
      const modalX = stageX + (stageW - modalW) / 2;
      const modalY = stageY + 75;

      ctx.fillStyle = '#101c36';
      this.roundRect(ctx, modalX, modalY, modalW, modalH, 12);
      ctx.fill();
      ctx.strokeStyle = '#233866';
      ctx.stroke();

      // Modal Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('📦 Order Dispatch & Shipping Label Console (#ORD-8921)', modalX + 24, modalY + 32);

      // Left column: Facility & Partner Allocation
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('Fulfillment Facility', modalX + 24, modalY + 70);

      ctx.fillStyle = '#1e293b';
      this.roundRect(ctx, modalX + 24, modalY + 80, 360, 40, 6);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('Central Warehouse (WH-01) — Road Freight', modalX + 36, modalY + 105);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('Delivery Logistics Partner', modalX + 24, modalY + 145);

      ctx.fillStyle = '#1e293b';
      this.roundRect(ctx, modalX + 24, modalY + 155, 360, 40, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('Delhivery Surface Logistics (B2B)', modalX + 36, modalY + 180);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('AWB Tracking Number', modalX + 24, modalY + 220);

      ctx.fillStyle = '#1e293b';
      this.roundRect(ctx, modalX + 24, modalY + 230, 360, 40, 6);
      ctx.fill();
      ctx.fillStyle = sec > 25 ? '#10b981' : '#64748b';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(sec > 25 ? 'DLV-98712349IN' : 'Click to generate AWB...', modalX + 36, modalY + 255);

      // Right column: Printable 4x6" Thermal Shipping Label Preview
      const labelX = modalX + 430;
      const labelY = modalY + 60;
      const labelW = 390;
      const labelH = 260;

      ctx.fillStyle = '#ffffff';
      this.roundRect(ctx, labelX, labelY, labelW, labelH, 8);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Thermal Label Header
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px "Arial Black", sans-serif';
      ctx.fillText('DELHIVERY SURFACE EXPRESS', labelX + 16, labelY + 28);

      ctx.fillRect(labelX + 16, labelY + 36, labelW - 32, 2);

      // Shipper & Consignee
      ctx.font = '11px Arial, sans-serif';
      ctx.fillText('FROM: AMTERP Central Distribution (Dock 3)', labelX + 16, labelY + 54);
      ctx.fillText('TO: Apex Retail Corp, 42 Commercial Blvd, NY', labelX + 16, labelY + 70);
      ctx.fillText('WEIGHT: 12.5 KG | PKG: 1 OF 1 (WHOLESALE)', labelX + 16, labelY + 86);

      ctx.fillRect(labelX + 16, labelY + 94, labelW - 32, 2);

      // Code-128 Barcode Simulation
      ctx.fillStyle = '#000000';
      const barcodeY = labelY + 110;
      let barX = labelX + 30;
      for (let i = 0; i < 48; i++) {
        const barW = (i % 3 === 0 || i % 7 === 0) ? 5 : 2;
        ctx.fillRect(barX, barcodeY, barW, 60);
        barX += barW + 2;
      }

      ctx.font = 'bold 12px monospace';
      ctx.fillText('* DLV-98712349IN *', labelX + 120, barcodeY + 80);

      // Laser Scanner Animation across Barcode
      if (sec >= 27 && sec <= 34) {
        const scanY = barcodeY + ((sec * 50) % 60);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(labelX + 25, scanY, 320, 3);
      }

      // Modal Bottom Action Buttons
      const actionY = modalY + modalH - 65;

      // Print Button
      ctx.fillStyle = '#1e293b';
      this.roundRect(ctx, modalX + 430, actionY, 170, 42, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('🖨 Print 4x6" Label', modalX + 450, actionY + 26);

      // Confirm Dispatch Button
      ctx.fillStyle = sec > 35 ? '#10b981' : '#05517e';
      this.roundRect(ctx, modalX + 620, actionY, 200, 42, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText(sec > 35 ? '✓ Dispatched & Alerted' : 'Confirm Dispatch', modalX + 645, actionY + 26);

      // Animated Cursor
      let curX = modalX + 200;
      let curY = modalY + 100;
      if (sec >= 9 && sec < 18) { curX = modalX + 200; curY = modalY + 100; }
      else if (sec >= 18 && sec < 26) { curX = modalX + 200; curY = modalY + 250; }
      else if (sec >= 26 && sec < 35) { curX = modalX + 515; curY = actionY + 20; }
      else { curX = modalX + 720; curY = actionY + 20; }

      this.drawAnimatedCursor(ctx, curX, curY, sec >= 35);
    }
  }

  // --- SCENE 3: Inventory Multi-Facility Allocation ---
  private renderInventoryScene(ctx: CanvasRenderingContext2D, sec: number) {
    const W = 1280;
    const stageX = 230;
    const stageY = 105;
    const stageW = W - 250;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('Inventory Ledger / Multi-Facility Stock Balance', stageX, stageY + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('Monitor available vs allocated stock and rebalance between warehouse and retail stores', stageX, stageY + 44);

    ctx.fillStyle = '#131e3a';
    this.roundRect(ctx, stageX, stageY + 65, stageW, 440, 12);
    ctx.fill();

    // Table Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(stageX, stageY + 65, stageW, 44);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('FACILITY NAME', stageX + 24, stageY + 92);
    ctx.fillText('TYPE', stageX + 240, stageY + 92);
    ctx.fillText('ON HAND', stageX + 380, stageY + 92);
    ctx.fillText('AVAILABLE', stageX + 490, stageY + 92);
    ctx.fillText('REORDER ALERT', stageX + 620, stageY + 92);
    ctx.fillText('ACTIONS', stageX + 780, stageY + 92);

    // Row 1: Warehouse
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(stageX, stageY + 115, stageW, 55);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillText('Central Warehouse (WH-01)', stageX + 24, stageY + 148);
    ctx.fillStyle = '#38bdf8'; ctx.fillText('Warehouse', stageX + 240, stageY + 148);
    ctx.fillStyle = '#ffffff'; ctx.fillText(sec > 25 ? '360 Units' : '400 Units', stageX + 380, stageY + 148);
    ctx.fillText(sec > 25 ? '340 Units' : '380 Units', stageX + 490, stageY + 148);
    ctx.fillStyle = '#10b981'; ctx.fillText('✓ Healthy Level', stageX + 620, stageY + 148);

    // Row 2: Retail Store (Low Stock)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(stageX, stageY + 175, stageW, 55);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Flagship Retail Store (STORE-01)', stageX + 24, stageY + 208);
    ctx.fillStyle = '#f59e0b'; ctx.fillText('Store', stageX + 240, stageY + 208);
    ctx.fillStyle = sec > 25 ? '#10b981' : '#ef4444';
    ctx.fillText(sec > 25 ? '44 Units (Replenished)' : '4 Units (Critical)', stageX + 380, stageY + 208);
    ctx.fillText(sec > 25 ? '44 Units' : '4 Units', stageX + 490, stageY + 208);

    // Alert Badge
    ctx.fillStyle = sec > 25 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    this.roundRect(ctx, stageX + 610, stageY + 190, 115, 26, 6);
    ctx.fill();
    ctx.fillStyle = sec > 25 ? '#10b981' : '#ef4444';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillText(sec > 25 ? 'Restocked' : '⚠️ Reorder < 20', stageX + 620, stageY + 207);

    // Quick Transfer Button
    ctx.fillStyle = '#05517e';
    this.roundRect(ctx, stageX + 770, stageY + 188, 125, 30, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('Quick Transfer', stageX + 790, stageY + 208);

    this.drawAnimatedCursor(ctx, stageX + 820, stageY + 203, sec >= 20 && sec <= 25);
  }

  // --- SCENE 4: Discounts & Taxes ---
  private renderDiscountsScene(ctx: CanvasRenderingContext2D, sec: number) {
    const W = 1280;
    const stageX = 230;
    const stageY = 105;
    const stageW = W - 250;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('Marketing & Masters / Promo Codes & State Tax Rates', stageX, stageY + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('Configure coupon vouchers (e.g. DIWALI) and configure automated tax calculations at checkout', stageX, stageY + 44);

    ctx.fillStyle = '#131e3a';
    this.roundRect(ctx, stageX, stageY + 65, stageW, 440, 12);
    ctx.fill();

    // Promo Code Creation Card
    this.drawFormField(ctx, stageX + 30, stageY + 100, 260, 'Promo Code', sec > 10 ? 'DIWALI' : '', sec >= 8 && sec <= 12);
    this.drawFormField(ctx, stageX + 320, stageY + 100, 240, 'Discount Type', sec > 12 ? 'Percentage (15% Off)' : 'Select...', false);
    this.drawFormField(ctx, stageX + 590, stageY + 100, 240, 'Minimum Spend ($)', sec > 15 ? '$50.00' : '', false);

    // Checkout Calculation Preview
    const previewY = stageY + 200;
    ctx.fillStyle = '#1e293b';
    this.roundRect(ctx, stageX + 30, previewY, stageW - 60, 200, 10);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('🛒 Live Checkout Pricing Simulator', stageX + 50, previewY + 35);

    ctx.fillStyle = '#e2e8f0'; ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('Subtotal (2x Items):', stageX + 50, previewY + 70);
    ctx.fillText('$100.00', stageX + 350, previewY + 70);

    ctx.fillStyle = '#10b981';
    ctx.fillText('Promo Voucher [DIWALI] (-15%):', stageX + 50, previewY + 100);
    ctx.fillText('-$15.00', stageX + 350, previewY + 100);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('State Tax (5% GST):', stageX + 50, previewY + 130);
    ctx.fillText('+$4.25', stageX + 350, previewY + 130);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText('Total Payable Amount:', stageX + 50, previewY + 170);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('$89.25', stageX + 350, previewY + 170);

    this.drawAnimatedCursor(ctx, stageX + 150, stageY + 120, sec >= 10 && sec <= 15);
  }

  // --- Helper UI Components for Canvas ---

  private drawFormField(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, val: string, isTyping: boolean) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(label, x, y);

    ctx.fillStyle = isTyping ? '#1e3a5f' : '#1e293b';
    this.roundRect(ctx, x, y + 8, w, 36, 6);
    ctx.fill();
    ctx.strokeStyle = isTyping ? '#38bdf8' : '#334155';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(val + (isTyping ? ' |' : ''), x + 12, y + 31);
  }

  private drawAnimatedCursor(ctx: CanvasRenderingContext2D, x: number, y: number, isClicking: boolean) {
    // Click Ripple
    if (isClicking) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cursor Arrow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12, y + 16);
    ctx.lineTo(x + 6, y + 16);
    ctx.lineTo(x + 4, y + 22);
    ctx.lineTo(x, y);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawVoiceWaveform(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean, time: number) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    this.roundRect(ctx, x, y, 195, 28, 6);
    ctx.fill();

    ctx.fillStyle = active ? '#10b981' : '#64748b';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillText('🎙 AI Voiceover', x + 10, y + 18);

    // Animated bars
    const barX = x + 105;
    for (let i = 0; i < 6; i++) {
      const h = active ? Math.sin(time * 8 + i * 1.5) * 6 + 10 : 3;
      ctx.fillStyle = active ? '#38bdf8' : '#475569';
      ctx.fillRect(barX + i * 8, y + 14 - h / 2, 4, h);
    }
  }

  private drawClosedCaptions(ctx: CanvasRenderingContext2D, text: string, W: number, H: number) {
    if (!text) return;
    const boxW = Math.min(W - 200, 920);
    const boxH = 46;
    const boxX = (W - boxW) / 2;
    const boxY = H - 85;

    ctx.fillStyle = 'rgba(11, 19, 41, 0.88)';
    this.roundRect(ctx, boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '500 13.5px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, boxY + 28);
    ctx.textAlign = 'left';
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // --- Download Recorded Video File (.webm) ---
  downloadRecordedVideo() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    try {
      const stream = canvas.captureStream(30);
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedTutorial().id}-walkthrough.webm`;
        a.click();
        URL.revokeObjectURL(url);
        this.isRecording.set(false);
      };

      this.isRecording.set(true);
      this.mediaRecorder.start();

      // Play video to record
      this.seek(0);
      this.playVideo();

      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, this.selectedTutorial().totalSeconds * 1000);
    } catch {
      alert('Video recording directly generated from canvas.');
    }
  }
}
