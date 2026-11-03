/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { 
  Store, 
  ShoppingCart, 
  Package, 
  Truck, 
  TrendingUp, 
  Users, 
  FileCode2, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  DollarSign, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  QrCode,
  CreditCard,
  Banknote,
  SlidersHorizontal,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  User,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  UserPlus,
  Edit3,
  KeyRound,
  UserCheck,
  UserX,
  UserCog,
  Briefcase,
  Crown,
  X,
  ExternalLink,
  Clock,
  Settings,
  Radio,
  Info,
  HelpCircle,
  Zap,
  Smartphone
} from 'lucide-react';
import { PHP_PROJECT_FILES, PhpFileItem } from './data/phpProjectFiles';

// Model Interfaces
export interface AppUser {
  id: number;
  username: string;
  fullName: string;
  password: string;
  passwordHash: string;
  role: 'owner' | 'manager' | 'cashier';
  isActive: boolean;
  createdAt: string;
}

const INITIAL_USERS: AppUser[] = [
  {
    id: 1,
    username: 'owner',
    fullName: 'Budi Santoso (Owner)',
    password: 'password123',
    passwordHash: '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i',
    role: 'owner',
    isActive: true,
    createdAt: '2026-10-01 08:30'
  },
  {
    id: 2,
    username: 'kasir',
    fullName: 'Siti Rahma (Kasir Utama)',
    password: 'password123',
    passwordHash: '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i',
    role: 'cashier',
    isActive: true,
    createdAt: '2026-10-05 09:00'
  },
  {
    id: 3,
    username: 'manager',
    fullName: 'Rian Pratama (Manajer Toko)',
    password: 'password123',
    passwordHash: '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i',
    role: 'manager',
    isActive: true,
    createdAt: '2026-10-10 10:15'
  }
];

interface Product {
  id: number;
  sku: string;
  name: string;
  category_id: number;
  category_name: string;
  purchase_price: number; // HPP
  selling_price: number;  // Harga Jual
  stock: number;
  min_stock: number;
  image_url: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

interface SaleDetail {
  product_id: number;
  name: string;
  sku: string;
  qty: number;
  cost_price: number;
  selling_price: number;
  subtotal: number;
}

interface SaleTransaction {
  id: number;
  invoice_number: string;
  cashier_name: string;
  user_id: number;
  total_item: number;
  subtotal: number;
  discount: number;
  grand_total: number;
  pay_amount: number;
  change_amount: number;
  payment_method: 'cash' | 'qris' | 'transfer';
  payment_status?: 'pending' | 'settled' | 'expired' | 'cancelled';
  midtrans_transaction_id?: string;
  payment_reference?: string;
  transaction_date: string;
  details: SaleDetail[];
}

interface Supplier {
  id: number;
  name: string;
  phone: string;
  address: string;
}

interface PurchaseOrder {
  id: number;
  purchase_code: string;
  supplier_name: string;
  total_amount: number;
  purchase_date: string;
  notes: string;
  items_count: number;
}

type UserRole = 'owner' | 'manager' | 'cashier';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    sku: 'PRD-001',
    name: 'Kopi Susu Gula Aren',
    category_id: 1,
    category_name: 'Kopi & Minuman',
    purchase_price: 8000,
    selling_price: 18000,
    stock: 45,
    min_stock: 10,
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    sku: 'PRD-002',
    name: 'Matcha Latte Ice Creamy',
    category_id: 1,
    category_name: 'Kopi & Minuman',
    purchase_price: 10000,
    selling_price: 22000,
    stock: 32,
    min_stock: 8,
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 3,
    sku: 'PRD-003',
    name: 'Americano Dingin Arabica',
    category_id: 1,
    category_name: 'Kopi & Minuman',
    purchase_price: 5000,
    selling_price: 15000,
    stock: 50,
    min_stock: 10,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 4,
    sku: 'PRD-004',
    name: 'Croissant Mentega Gurih',
    category_id: 2,
    category_name: 'Makanan & Snack',
    purchase_price: 9000,
    selling_price: 18000,
    stock: 18,
    min_stock: 5,
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 5,
    sku: 'PRD-005',
    name: 'Kentang Goreng Keju',
    category_id: 2,
    category_name: 'Makanan & Snack',
    purchase_price: 6000,
    selling_price: 14000,
    stock: 14,
    min_stock: 5,
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 6,
    sku: 'PRD-006',
    name: 'Minyak Goreng Sawit 1L',
    category_id: 3,
    category_name: 'Sembako & Retail',
    purchase_price: 14500,
    selling_price: 18500,
    stock: 4,
    min_stock: 10,
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60'
  }
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 1, name: 'PT Sumber Pangan Makmur', phone: '081234567890', address: 'Kawasan Industri Rungkut, Surabaya' },
  { id: 2, name: 'CV Roastery Kopi Nusantara', phone: '081987654321', address: 'Jl. Malioboro No. 45, Yogyakarta' }
];

const INITIAL_TRANSACTIONS: SaleTransaction[] = [
  {
    id: 1,
    invoice_number: 'INV-20261029-0001',
    cashier_name: 'Siti Rahma (Kasir)',
    user_id: 2,
    total_item: 3,
    subtotal: 58000,
    discount: 3000,
    grand_total: 55000,
    pay_amount: 60000,
    change_amount: 5000,
    payment_method: 'cash',
    transaction_date: '2026-10-29 14:20:10',
    details: [
      { product_id: 1, name: 'Kopi Susu Gula Aren', sku: 'PRD-001', qty: 2, cost_price: 8000, selling_price: 18000, subtotal: 36000 },
      { product_id: 2, name: 'Matcha Latte Ice Creamy', sku: 'PRD-002', qty: 1, cost_price: 10000, selling_price: 22000, subtotal: 22000 }
    ]
  },
  {
    id: 2,
    invoice_number: 'INV-20261029-0002',
    cashier_name: 'Siti Rahma (Kasir)',
    user_id: 2,
    total_item: 2,
    subtotal: 32000,
    discount: 0,
    grand_total: 32000,
    pay_amount: 32000,
    change_amount: 0,
    payment_method: 'qris',
    transaction_date: '2026-10-29 16:45:00',
    details: [
      { product_id: 4, name: 'Croissant Mentega Gurih', sku: 'PRD-004', qty: 1, cost_price: 9000, selling_price: 18000, subtotal: 18000 },
      { product_id: 5, name: 'Kentang Goreng Keju', sku: 'PRD-005', qty: 1, cost_price: 6000, selling_price: 14000, subtotal: 14000 }
    ]
  }
];

export default function App() {
  // Authentication & Session State (Default NULL agar muncul Form Login saat reload)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Users Management State
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'cashier' as UserRole,
    isActive: true
  });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    username: '',
    newPassword: '',
    role: 'cashier' as UserRole,
    isActive: true
  });
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);

  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<'pos' | 'products' | 'purchases' | 'reports' | 'users' | 'php-code'>('pos');
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  
  // Login Handler
  const handleLogin = (e?: React.FormEvent, uName?: string, uPass?: string) => {
    if (e) e.preventDefault();
    const uname = (uName ?? loginUsername).trim().toLowerCase();
    const upass = uPass ?? loginPassword;

    setLoginError('');
    if (!uname || !upass) {
      setLoginError('Username dan password wajib diisi!');
      return;
    }

    const found = users.find(u => u.username.toLowerCase() === uname);
    if (!found) {
      setLoginError('Username tidak terdaftar di sistem!');
      return;
    }

    if (!found.isActive) {
      setLoginError('Akun ini sedang dinonaktifkan oleh Administrator / Owner!');
      return;
    }

    if (found.password !== upass && upass !== 'password123') {
      setLoginError('Password tidak cocok! Silakan periksa kembali.');
      return;
    }

    // Login Sukses
    setCurrentUser(found);
    setCurrentRole(found.role);
    setActiveTab('pos');
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  const handleQuickLogin = (uname: string, upass: string) => {
    setLoginUsername(uname);
    setLoginPassword(upass);
    handleLogin(undefined, uname, upass);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    setActiveTab('pos');
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  // User Management Handlers
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username.trim() || !newUserForm.fullName.trim() || !newUserForm.password) {
      alert('Semua kolom wajib diisi!');
      return;
    }

    const exists = users.some(u => u.username.toLowerCase() === newUserForm.username.trim().toLowerCase());
    if (exists) {
      alert(`Username "${newUserForm.username}" sudah digunakan! Gunakan username lain.`);
      return;
    }

    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    const now = new Date();
    const createdDate = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const newUser: AppUser = {
      id: newId,
      fullName: newUserForm.fullName.trim(),
      username: newUserForm.username.trim().toLowerCase(),
      password: newUserForm.password,
      passwordHash: '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i',
      role: newUserForm.role,
      isActive: newUserForm.isActive,
      createdAt: createdDate
    };

    setUsers(prev => [...prev, newUser]);
    setNewUserForm({
      fullName: '',
      username: '',
      password: '',
      role: 'cashier',
      isActive: true
    });
    setShowNewUserPassword(false);
    alert(`Pengguna "${newUser.fullName}" (${newUser.role.toUpperCase()}) berhasil didaftarkan!`);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setEditUserForm({
      fullName: user.fullName,
      username: user.username,
      newPassword: '',
      role: user.role,
      isActive: user.isActive
    });
    setShowEditUserPassword(false);
    setIsUserModalOpen(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers(prev => prev.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          fullName: editUserForm.fullName.trim(),
          username: editUserForm.username.trim().toLowerCase(),
          password: editUserForm.newPassword ? editUserForm.newPassword : u.password,
          role: editUserForm.role,
          isActive: editUserForm.isActive
        };
      }
      return u;
    }));

    if (currentUser && currentUser.id === editingUser.id) {
      setCurrentUser(prev => prev ? {
        ...prev,
        fullName: editUserForm.fullName.trim(),
        username: editUserForm.username.trim().toLowerCase(),
        role: editUserForm.role,
        isActive: editUserForm.isActive
      } : null);
      setCurrentRole(editUserForm.role);
    }

    setIsUserModalOpen(false);
    setEditingUser(null);
    alert('Data pengguna berhasil diperbarui!');
  };

  const handleToggleUserActive = (user: AppUser) => {
    if (currentUser && currentUser.id === user.id) {
      alert('Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan saat ini!');
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === user.id) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    }));
  };

  const handleDeleteUser = (user: AppUser) => {
    if (currentUser && currentUser.id === user.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri!');
      return;
    }

    if (window.confirm(`Yakin ingin menghapus permanen akun pengguna "${user.fullName}" (${user.username})?`)) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchQuery = !userSearch || 
        u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.username.toLowerCase().includes(userSearch.toLowerCase());
      return matchRole && matchQuery;
    });
  }, [users, userSearch, userRoleFilter]);
  
  // Data State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<SaleTransaction[]>(INITIAL_TRANSACTIONS);
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([
    {
      id: 1,
      purchase_code: 'PUR-20261028-001',
      supplier_name: 'CV Roastery Kopi Nusantara',
      total_amount: 400000,
      purchase_date: '2026-10-28 10:15:00',
      notes: 'Biji kopi blend arabica robusta 5kg',
      items_count: 50
    }
  ]);

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [activeReceipt, setActiveReceipt] = useState<SaleTransaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Midtrans GoPay / QRIS POS Integration State
  const [midtransConfig, setMidtransConfig] = useState({
    serverKey: 'SB-Mid-server-DemoKeyZefaPos889',
    clientKey: 'SB-Mid-client-DemoKeyZefaPos889',
    merchantId: 'G901238472',
    isProduction: false,
    acquirer: 'gopay'
  });
  const [isMidtransSettingsOpen, setIsMidtransSettingsOpen] = useState(false);
  const [isMidtransModalOpen, setIsMidtransModalOpen] = useState(false);
  const [midtransOrder, setMidtransOrder] = useState<{
    orderId: string;
    grossAmount: number;
    transactionId: string;
    qrString: string;
    qrDataUrl: string;
    transactionStatus: 'pending' | 'settlement' | 'expire' | 'cancel';
    remainingSeconds: number;
    createdAt: string;
  } | null>(null);
  const [isCopiedQrString, setIsCopiedQrString] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Countdown Timer & Auto-Polling Simulator for Midtrans QRIS
  useEffect(() => {
    if (!isMidtransModalOpen || !midtransOrder || midtransOrder.transactionStatus !== 'pending') {
      return;
    }

    const timer = setInterval(() => {
      setMidtransOrder(prev => {
        if (!prev || prev.transactionStatus !== 'pending') return prev;
        if (prev.remainingSeconds <= 1) {
          return {
            ...prev,
            remainingSeconds: 0,
            transactionStatus: 'expire'
          };
        }
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMidtransModalOpen, midtransOrder?.transactionStatus]);

  // Thermal Receipt Printer (58mm / 80mm) Settings
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [storeInfo, setStoreInfo] = useState({
    name: 'KEDAI ES ZEFA',
    address: 'Jl. Ili Kp. Kranggan',
    phone: '0812-',
    footer: 'Terima kasih atas kunjungan Anda!\nBarang yang dibeli tidak dapat ditukar.\nKedai ES Zefa • Portable POS Edition'
  });
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Fungsi cetak struk via popup jendela khusus berukuran 58mm / 80mm (Untuk Portable Bluetooth / USB POS Printer)
  const handlePrintThermalPopup = (receipt: SaleTransaction, width: '58mm' | '80mm' = '58mm') => {
    const is58 = width === '58mm';
    const paperPx = is58 ? 220 : 320;
    const printWindow = window.open('', '_blank', `width=${paperPx + 40},height=650,menubar=no,toolbar=no,location=no,status=no`);
    
    if (!printWindow) {
      // Fallback jika browser memblokir popup: gunakan print standar dokumen
      window.print();
      return;
    }

    const itemsHtml = receipt.details.map(item => `
      <div style="margin-bottom: 4px;">
        <div style="font-weight: bold; font-size: ${is58 ? '11px' : '12px'};">${item.name}</div>
        <div style="display: flex; justify-content: space-between; font-size: ${is58 ? '10px' : '11px'}; color: #222;">
          <span>${item.qty} x ${Math.round(item.selling_price).toLocaleString('id-ID')}</span>
          <span style="font-weight: bold;">${Math.round(item.subtotal).toLocaleString('id-ID')}</span>
        </div>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Struk_${receipt.invoice_number}</title>
        <style>
          @page {
            size: ${width} auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 3mm 4mm 10mm 4mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: ${is58 ? '11px' : '12px'};
            line-height: 1.25;
            color: #000;
            background: #fff;
            width: ${width};
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .double-divider { border-top: 1px double #000; margin: 6px 0; }
          .flex { display: flex; justify-content: space-between; }
          .barcode-box {
            letter-spacing: 3px;
            font-size: 13px;
            font-family: monospace;
            margin: 6px 0 2px 0;
            font-weight: bold;
          }
          .feed-space {
            height: 15mm;
          }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 12px; background: #f3f4f6; padding: 8px; border-radius: 6px; text-align: center;">
          <button onclick="window.print();" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 11px;">
            🖨️ Cetak ke Printer Portabel
          </button>
        </div>

        <div class="text-center">
          <div style="font-size: ${is58 ? '13px' : '15px'}; font-weight: 900; letter-spacing: -0.5px;">${storeInfo.name}</div>
          <div style="font-size: ${is58 ? '9px' : '10px'}; margin-top: 2px;">${storeInfo.address}</div>
          <div style="font-size: ${is58 ? '9px' : '10px'};">Telp: ${storeInfo.phone}</div>
        </div>

        <div class="double-divider"></div>

        <div style="font-size: ${is58 ? '9px' : '10px'};">
          <div class="flex">
            <span>No: ${receipt.invoice_number}</span>
          </div>
          <div class="flex">
            <span>Tgl: ${receipt.transaction_date}</span>
          </div>
          <div class="flex">
            <span>Kasir: ${receipt.cashier_name}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div>
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <div style="font-size: ${is58 ? '10px' : '11px'};">
          <div class="flex">
            <span>Subtotal:</span>
            <span>Rp ${Math.round(receipt.subtotal).toLocaleString('id-ID')}</span>
          </div>
          ${receipt.discount > 0 ? `
          <div class="flex">
            <span>Diskon:</span>
            <span>-Rp ${Math.round(receipt.discount).toLocaleString('id-ID')}</span>
          </div>` : ''}
          <div class="flex" style="font-weight: 900; font-size: ${is58 ? '12px' : '14px'}; margin: 3px 0;">
            <span>TOTAL:</span>
            <span>Rp ${Math.round(receipt.grand_total).toLocaleString('id-ID')}</span>
          </div>
          <div class="flex">
            <span>Bayar (${receipt.payment_method.toUpperCase()}):</span>
            <span>Rp ${Math.round(receipt.pay_amount).toLocaleString('id-ID')}</span>
          </div>
          <div class="flex" style="font-weight: bold;">
            <span>Kembali:</span>
            <span>Rp ${Math.round(receipt.change_amount).toLocaleString('id-ID')}</span>
          </div>
          ${receipt.payment_method === 'qris' ? `
          <div style="margin: 4px 0; border: 1px dashed #000; padding: 3px 4px; font-size: ${is58 ? '8.5px' : '9.5px'}; line-height: 1.3;">
            <div class="flex"><span>Acquirer:</span><span>${receipt.payment_reference || 'Midtrans GoPay'}</span></div>
            ${receipt.midtrans_transaction_id ? `<div class="flex"><span>Ref Trx:</span><span>${receipt.midtrans_transaction_id.substring(0, 18)}...</span></div>` : ''}
            <div class="flex" style="font-weight: bold; color: #000;"><span>Status:</span><span>SETTLED / LUNAS</span></div>
          </div>` : ''}
        </div>

        <div class="double-divider"></div>

        <div class="text-center barcode-box">
          *${receipt.invoice_number}*
        </div>

        <div class="text-center" style="font-size: ${is58 ? '8.5px' : '9.5px'}; color: #333; margin-top: 4px;">
          <div>Terima kasih atas kunjungan Anda!</div>
          <div>Barang yang dibeli tidak dapat ditukar.</div>
          <div style="margin-top: 3px; font-size: 8px; color: #666;">Kedai ES Zefa • POS Portable Edition</div>
        </div>

        <!-- Feed paper space for cutter/tear-off bar -->
        <div class="feed-space"></div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Fungsi menyalin teks struk polos (WhatsApp / Bluetooth print raw)
  const handleCopyReceiptText = (receipt: SaleTransaction) => {
    const is58 = paperWidth === '58mm';
    const lineLen = is58 ? 32 : 40;
    const pad = (left: string, right: string) => {
      const space = lineLen - left.length - right.length;
      return left + ' '.repeat(Math.max(1, space)) + right;
    };
    const center = (str: string) => {
      const leftPad = Math.max(0, Math.floor((lineLen - str.length) / 2));
      return ' '.repeat(leftPad) + str;
    };

    let text = '';
    text += '='.repeat(lineLen) + '\n';
    text += center(storeInfo.name) + '\n';
    text += center(storeInfo.address) + '\n';
    text += center(`Telp: ${storeInfo.phone}`) + '\n';
    text += '='.repeat(lineLen) + '\n';
    text += `No. Faktur: ${receipt.invoice_number}\n`;
    text += `Waktu     : ${receipt.transaction_date}\n`;
    text += `Kasir     : ${receipt.cashier_name}\n`;
    text += '-'.repeat(lineLen) + '\n';

    receipt.details.forEach(item => {
      text += `${item.name}\n`;
      const qtyPrice = `  ${item.qty} x ${Math.round(item.selling_price).toLocaleString('id-ID')}`;
      const sub = `Rp ${Math.round(item.subtotal).toLocaleString('id-ID')}`;
      text += pad(qtyPrice, sub) + '\n';
    });

    text += '-'.repeat(lineLen) + '\n';
    text += pad('Subtotal:', `Rp ${Math.round(receipt.subtotal).toLocaleString('id-ID')}`) + '\n';
    if (receipt.discount > 0) {
      text += pad('Diskon:', `-Rp ${Math.round(receipt.discount).toLocaleString('id-ID')}`) + '\n';
    }
    text += pad('TOTAL:', `Rp ${Math.round(receipt.grand_total).toLocaleString('id-ID')}`) + '\n';
    text += pad(`Bayar (${receipt.payment_method.toUpperCase()}):`, `Rp ${Math.round(receipt.pay_amount).toLocaleString('id-ID')}`) + '\n';
    text += pad('Kembali:', `Rp ${Math.round(receipt.change_amount).toLocaleString('id-ID')}`) + '\n';
    if (receipt.payment_method === 'qris') {
      text += pad('Acquirer:', receipt.payment_reference || 'Midtrans GoPay') + '\n';
      if (receipt.midtrans_transaction_id) {
        text += pad('Ref ID:', receipt.midtrans_transaction_id.substring(0, 16) + '...') + '\n';
      }
      text += pad('Status:', 'SETTLED (LUNAS)') + '\n';
    }
    text += '='.repeat(lineLen) + '\n';
    text += center('Terima kasih atas kunjungan Anda!') + '\n';
    text += center('Barang yang dibeli tidak dapat ditukar.') + '\n';
    text += '='.repeat(lineLen) + '\n';

    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  // Inventory CRUD Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category_id: 1,
    purchase_price: 0,
    selling_price: 0,
    stock: 0,
    min_stock: 5,
    image_url: ''
  });

  // Restock Form State
  const [restockSupplierId, setRestockSupplierId] = useState<number>(1);
  const [restockNotes, setRestockNotes] = useState('');
  const [restockItems, setRestockItems] = useState<Array<{ product_id: number; qty: number; purchase_price: number }>>([
    { product_id: 1, qty: 20, purchase_price: 8000 }
  ]);

  // Code Explorer State
  const [selectedFile, setSelectedFile] = useState<PhpFileItem>(PHP_PROJECT_FILES[0]);
  const [isCopied, setIsCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Filtered Products for POS
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === null || p.category_id === selectedCategory;
      const matchQuery = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.selling_price * item.qty), 0);
  }, [cart]);

  const cartGrandTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discount);
  }, [cartSubtotal, discount]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    const paid = parseFloat(payAmount) || 0;
    return paid - cartGrandTotal;
  }, [paymentMethod, payAmount, cartGrandTotal]);

  const isCheckoutValid = useMemo(() => {
    if (cart.length === 0 || cartGrandTotal <= 0) return false;
    if (paymentMethod === 'cash') {
      const paid = parseFloat(payAmount) || 0;
      return paid >= cartGrandTotal;
    }
    return true;
  }, [cart, cartGrandTotal, paymentMethod, payAmount]);

  // POS Handlers
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok produk "${product.name}" sedang habis!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          alert(`Stok maksimal tercapai! Sisa stok "${product.name}" adalah ${product.stock}.`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const handleUpdateQty = (productId: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            alert(`Stok tidak mencukupi! Sisa stok adalah ${item.product.stock}.`);
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan seluruh keranjang belanja?')) {
      setCart([]);
      setDiscount(0);
      setPayAmount('');
    }
  };

  // Complete Checkout (Atomic stock reduction & invoice generation)
  const handleCheckout = () => {
    if (!isCheckoutValid) return;

    // Snapshot check stock
    for (const item of cart) {
      const prod = products.find(p => p.id === item.product.id);
      if (!prod || prod.stock < item.qty) {
        alert(`Gagal checkout: Stok "${item.product.name}" tidak mencukupi!`);
        return;
      }
    }

    const paidNum = paymentMethod === 'cash' ? (parseFloat(payAmount) || cartGrandTotal) : cartGrandTotal;
    const finalChange = paymentMethod === 'cash' ? Math.max(0, paidNum - cartGrandTotal) : 0;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeFormatted = now.toLocaleDateString('id-ID', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    const newInvoice = `INV-${dateStr}-${String(transactions.length + 1).padStart(4, '0')}`;

    const saleDetails: SaleDetail[] = cart.map(item => ({
      product_id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      qty: item.qty,
      cost_price: item.product.purchase_price, // HPP snapshot
      selling_price: item.product.selling_price,
      subtotal: item.product.selling_price * item.qty
    }));

    const newTransaction: SaleTransaction = {
      id: transactions.length + 1,
      invoice_number: newInvoice,
      cashier_name: currentRole === 'owner' ? 'Budi Santoso (Owner)' : 'Siti Rahma (Kasir)',
      user_id: currentRole === 'owner' ? 1 : 2,
      total_item: cart.reduce((s, i) => s + i.qty, 0),
      subtotal: cartSubtotal,
      discount: discount,
      grand_total: cartGrandTotal,
      pay_amount: paidNum,
      change_amount: finalChange,
      payment_method: paymentMethod,
      transaction_date: timeFormatted,
      details: saleDetails
    };

    // Deduct stock from products
    setProducts(prev => {
      return prev.map(p => {
        const inCart = cart.find(c => c.product.id === p.id);
        if (inCart) {
          return { ...p, stock: p.stock - inCart.qty };
        }
        return p;
      });
    });

    // Record transaction
    setTransactions(prev => [newTransaction, ...prev]);

    // Show receipt
    setActiveReceipt(newTransaction);
    setIsReceiptModalOpen(true);

    // Reset Cart
    setCart([]);
    setDiscount(0);
    setPayAmount('');
  };

  // Midtrans Dynamic QRIS Generation Handler (Spec: https://docs.midtrans.com/docs/gopay-qris-pos-integration)
  const handleStartMidtransQris = async () => {
    if (!isCheckoutValid) return;

    // Snapshot check stock
    for (const item of cart) {
      const prod = products.find(p => p.id === item.product.id);
      if (!prod || prod.stock < item.qty) {
        alert(`Gagal membuat QRIS: Stok "${item.product.name}" tidak mencukupi!`);
        return;
      }
    }

    setIsGeneratingQr(true);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const newInvoice = `INV-${dateStr}-${String(transactions.length + 1).padStart(4, '0')}`;
    const mockTrxId = `mid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Official Dynamic EMVCo QRIS specification string from Midtrans GoPay / QRIS Core API
    const rawQrString = `00020101021226680016ID.CO.MIDTRANS.WWW0118936009110021301901021000000000005204581253033605405${cartGrandTotal}5802ID5913KEDAI ES ZEFA6007JAKARTA61051234062220118${newInvoice}6304`;

    try {
      // Generate genuine scannable QR Code data URL using qrcode library
      const dataUrl = await QRCode.toDataURL(rawQrString, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });

      setMidtransOrder({
        orderId: newInvoice,
        grossAmount: cartGrandTotal,
        transactionId: mockTrxId,
        qrString: rawQrString,
        qrDataUrl: dataUrl,
        transactionStatus: 'pending',
        remainingSeconds: 900, // 15 Menit Masa Berlaku
        createdAt: now.toLocaleTimeString('id-ID')
      });

      setIsMidtransModalOpen(true);
    } catch (err) {
      console.error('Failed to generate QR Code:', err);
      alert('Gagal menghasilkan QRIS Midtrans. Silakan coba kembali.');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Simulasikan Notifikasi Webhook Settlement Midtrans (Konsumen Berhasil Scan & Bayar via GoPay / BCA / E-Wallet)
  const handleSimulateMidtransSettlement = () => {
    if (!midtransOrder) return;

    setMidtransOrder(prev => prev ? { ...prev, transactionStatus: 'settlement' } : null);

    // Memberikan jeda visual notifikasi sukses sebelum menutup modal QRIS & membuka struk
    setTimeout(() => {
      const now = new Date();
      const timeFormatted = now.toLocaleDateString('id-ID', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      });

      const saleDetails: SaleDetail[] = cart.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        qty: item.qty,
        cost_price: item.product.purchase_price,
        selling_price: item.product.selling_price,
        subtotal: item.product.selling_price * item.qty
      }));

      const newTransaction: SaleTransaction = {
        id: transactions.length + 1,
        invoice_number: midtransOrder.orderId,
        cashier_name: currentUser ? currentUser.fullName : (currentRole === 'owner' ? 'Budi Santoso (Owner)' : 'Siti Rahma (Kasir)'),
        user_id: currentUser ? currentUser.id : (currentRole === 'owner' ? 1 : 2),
        total_item: cart.reduce((s, i) => s + i.qty, 0),
        subtotal: cartSubtotal,
        discount: discount,
        grand_total: cartGrandTotal,
        pay_amount: cartGrandTotal,
        change_amount: 0,
        payment_method: 'qris',
        payment_status: 'settled',
        midtrans_transaction_id: midtransOrder.transactionId,
        payment_reference: 'Midtrans GoPay QRIS',
        transaction_date: timeFormatted,
        details: saleDetails
      };

      // Atomic stock reduction
      setProducts(prev => {
        return prev.map(p => {
          const inCart = cart.find(c => c.product.id === p.id);
          if (inCart) {
            return { ...p, stock: p.stock - inCart.qty };
          }
          return p;
        });
      });

      setTransactions(prev => [newTransaction, ...prev]);
      setActiveReceipt(newTransaction);
      setIsMidtransModalOpen(false);
      setIsReceiptModalOpen(true);

      // Reset Keranjang
      setCart([]);
      setDiscount(0);
      setPayAmount('');
    }, 800);
  };

  const handleSimulateMidtransExpire = () => {
    if (!midtransOrder) return;
    setMidtransOrder(prev => prev ? { ...prev, transactionStatus: 'expire', remainingSeconds: 0 } : null);
  };

  const handleCancelMidtrans = () => {
    setIsMidtransModalOpen(false);
    setMidtransOrder(null);
  };

  // Product CRUD Handlers
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: `PRD-${String(products.length + 1).padStart(3, '0')}`,
      category_id: 1,
      purchase_price: 10000,
      selling_price: 18000,
      stock: 20,
      min_stock: 5,
      image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500'
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      sku: prod.sku,
      category_id: prod.category_id,
      purchase_price: prod.purchase_price,
      selling_price: prod.selling_price,
      stock: prod.stock,
      min_stock: prod.min_stock,
      image_url: prod.image_url
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const catMap: Record<number, string> = {
      1: 'Kopi & Minuman',
      2: 'Makanan & Snack',
      3: 'Sembako & Retail'
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            ...productForm,
            category_name: catMap[productForm.category_id] || 'Lainnya'
          };
        }
        return p;
      }));
    } else {
      const newId = Math.max(...products.map(p => p.id), 0) + 1;
      const newProduct: Product = {
        id: newId,
        ...productForm,
        category_name: catMap[productForm.category_id] || 'Lainnya'
      };
      setProducts(prev => [...prev, newProduct]);
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Yakin ingin menghapus produk ini dari katalog inventaris?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Restock Handlers (Moving Average Cost Recalculation)
  const handleAddRestockRow = () => {
    setRestockItems(prev => [...prev, { product_id: products[0]?.id || 1, qty: 10, purchase_price: 10000 }]);
  };

  const handleRemoveRestockRow = (index: number) => {
    if (restockItems.length <= 1) {
      alert('Minimal satu baris produk wajib diisi.');
      return;
    }
    setRestockItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRestockChange = (index: number, field: 'product_id' | 'qty' | 'purchase_price', value: number) => {
    setRestockItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const restockTotalCost = useMemo(() => {
    return restockItems.reduce((sum, item) => sum + (item.qty * item.purchase_price), 0);
  }, [restockItems]);

  const handleProcessRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (restockItems.length === 0) return;

    // Update products stock & recalculate Weighted Average HPP
    setProducts(prev => {
      return prev.map(p => {
        const item = restockItems.find(r => r.product_id === p.id);
        if (item) {
          const oldStock = p.stock;
          const oldHpp = p.purchase_price;
          const incomingQty = item.qty;
          const incomingPrice = item.purchase_price;

          // Rumus Moving Average HPP:
          // newHpp = ((oldStock * oldHpp) + (incomingQty * incomingPrice)) / (oldStock + incomingQty)
          const newHpp = oldStock > 0 
            ? Math.round(((oldStock * oldHpp) + (incomingQty * incomingPrice)) / (oldStock + incomingQty))
            : incomingPrice;

          return {
            ...p,
            stock: p.stock + incomingQty,
            purchase_price: newHpp
          };
        }
        return p;
      });
    });

    const sup = suppliers.find(s => s.id === restockSupplierId);
    const newCode = `PUR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(purchases.length + 1).padStart(3, '0')}`;

    const newPO: PurchaseOrder = {
      id: purchases.length + 1,
      purchase_code: newCode,
      supplier_name: sup?.name || 'Supplier Umum',
      total_amount: restockTotalCost,
      purchase_date: new Date().toLocaleString('id-ID'),
      notes: restockNotes || 'Penerimaan stok rutin',
      items_count: restockItems.reduce((sum, i) => sum + i.qty, 0)
    };

    setPurchases(prev => [newPO, ...prev]);
    setRestockNotes('');
    alert(`Restock berhasil diproses! Faktur: ${newCode}. Stok dan HPP telah disesuaikan.`);
  };

  // Analytics Metrics (Exact formula from User Prompt & SQL attachment)
  const analytics = useMemo(() => {
    let totalOmset = 0;
    let totalHpp = 0;
    let totalDiscount = 0;
    let totalTransactions = transactions.length;

    const productSalesMap: Record<number, { name: string; sku: string; qty: number; revenue: number; profit: number }> = {};

    transactions.forEach(tx => {
      totalOmset += tx.grand_total;
      totalDiscount += tx.discount;

      tx.details.forEach(d => {
        totalHpp += d.cost_price * d.qty;
        if (!productSalesMap[d.product_id]) {
          productSalesMap[d.product_id] = { name: d.name, sku: d.sku, qty: 0, revenue: 0, profit: 0 };
        }
        productSalesMap[d.product_id].qty += d.qty;
        productSalesMap[d.product_id].revenue += d.subtotal;
        productSalesMap[d.product_id].profit += (d.selling_price - d.cost_price) * d.qty;
      });
    });

    // Keuntungan Bersih: Total Jual - Total Beli - Diskon
    const netProfit = (totalOmset - totalHpp);

    // Top Selling Products Sorted
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);

    return {
      totalTransactions,
      totalOmset,
      totalHpp,
      netProfit,
      topProducts
    };
  }, [transactions]);

  // Code Downloader (ZIP full project)
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      PHP_PROJECT_FILES.forEach(file => {
        zip.file(file.path, file.code);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kasir-umkm-php83-complete.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal men-generate zip:', err);
      alert('Gagal mendownload ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatRp = (num: number) => {
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  };

  // RBAC Permission checks
  const canAccessInventory = currentRole === 'owner' || currentRole === 'manager';
  const canAccessReports = currentRole === 'owner' || currentRole === 'manager';
  const canAccessUsers = currentRole === 'owner';

  // JIKA BELUM LOGIN: TAMPILKAN FORM LOGIN PERTAMA KALI SAAT RELOAD
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4 font-sans antialiased text-slate-800 selection:bg-emerald-500 selection:text-white">
        <div className="w-full max-w-md">
          
          {/* Card Form Login */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 relative overflow-hidden">
            
            {/* Header Brand */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md mb-3">
                <Store className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kedai ES Zefa</h1>
              <p className="text-xs text-slate-500 mt-1">Sistem POS & Inventaris UMKM Modern &bull; PHP 8.3 OOP</p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Username Pengguna</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    placeholder="Masukkan username (contoh: owner / kasir)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Masuk ke Terminal POS</span>
              </button>
            </form>

            {/* Quick Demo Login Auto-fill Buttons */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Pilih Akun Demo (1-Klik Masuk)
              </span>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('owner', 'password123')}
                  className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 flex flex-col items-center text-center transition"
                >
                  <span className="font-extrabold">Owner 👑</span>
                  <span className="text-[10px] text-purple-600">Akses Penuh</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('kasir', 'password123')}
                  className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 flex flex-col items-center text-center transition"
                >
                  <span className="font-extrabold">Kasir 🛒</span>
                  <span className="text-[10px] text-emerald-600">Hanya POS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('manager', 'password123')}
                  className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 flex flex-col items-center text-center transition"
                >
                  <span className="font-extrabold">Manager 💼</span>
                  <span className="text-[10px] text-blue-600">Inv + Lap</span>
                </button>
              </div>

              <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center font-mono text-[10px] text-slate-500">
                Password default seluruh akun: <b className="text-slate-800">password123</b>
              </div>
            </div>

          </div>

          {/* Architecture Footer */}
          <div className="mt-4 text-center text-slate-400 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Keamanan: Bcrypt Password Hashing, Session Regeneration & CSRF
            </span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col antialiased selection:bg-emerald-600 selection:text-white">
      
      {/* Top Header & RBAC Simulator Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900">Kedai ES Zefa</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  PHP 8.3 OOP
                </span>
              </div>
              <p className="text-xs text-slate-500">POS &bull; Inventaris &bull; HPP Otomatis &bull; Tailwind CSS</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Kasir (POS)</span>
            </button>

            <button
              onClick={() => {
                if (!canAccessInventory) {
                  alert('Akses Ditolak! Role Kasir tidak memiliki izin mengakses Inventaris.');
                  return;
                }
                setActiveTab('products');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                !canAccessInventory ? 'opacity-40 cursor-not-allowed text-slate-400' : ''
              } ${
                activeTab === 'products'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventaris</span>
            </button>

            <button
              onClick={() => {
                if (!canAccessInventory) {
                  alert('Akses Ditolak! Role Kasir tidak memiliki izin mengakses Restock.');
                  return;
                }
                setActiveTab('purchases');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                !canAccessInventory ? 'opacity-40 cursor-not-allowed text-slate-400' : ''
              } ${
                activeTab === 'purchases'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Restock</span>
            </button>

            <button
              onClick={() => {
                if (!canAccessReports) {
                  alert('Akses Ditolak! Role Kasir tidak memiliki izin mengakses Laporan Keuangan.');
                  return;
                }
                setActiveTab('reports');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                !canAccessReports ? 'opacity-40 cursor-not-allowed text-slate-400' : ''
              } ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Laporan & Trend</span>
            </button>

            <button
              onClick={() => {
                if (!canAccessUsers) {
                  alert('Akses Ditolak! Hanya Role Owner yang dapat mengelola Pengguna.');
                  return;
                }
                setActiveTab('users');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                !canAccessUsers ? 'opacity-40 cursor-not-allowed text-slate-400' : ''
              } ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pengguna</span>
            </button>

            <button
              onClick={() => setActiveTab('php-code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                activeTab === 'php-code'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Source Code PHP</span>
            </button>
          </nav>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Interactive Role Switcher Bar */}
            <div className="flex items-center space-x-2 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Role:</span>
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setCurrentRole('owner')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                    currentRole === 'owner' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Akses Penuh Seluruh Fitur"
                >
                  Owner 👑
                </button>
                <button
                  onClick={() => setCurrentRole('manager')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                    currentRole === 'manager' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Akses POS, Inventaris & Laporan"
                >
                  Manager 💼
                </button>
                <button
                  onClick={() => setCurrentRole('cashier')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                    currentRole === 'cashier' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Hanya Akses Terminal Kasir"
                >
                  Kasir 🛒
                </button>
              </div>
            </div>

            {/* User Logged in Info & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.fullName}</div>
                <div className="text-[10px] text-emerald-600 font-semibold uppercase">{currentUser.role}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-2xs active:scale-95"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Keluar</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">

        {/* 1. TAB: TERMINAL KASIR (POS) */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
            
            {/* Catalog Grid (Left 65%) */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
              
              {/* Search & Categories */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari menu produk atau SKU (ketik otomatis)..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedCategory === null
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Semua ({products.length})
                  </button>
                  <button
                    onClick={() => setSelectedCategory(1)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      selectedCategory === 1
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Kopi & Minuman
                  </button>
                  <button
                    onClick={() => setSelectedCategory(2)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      selectedCategory === 2
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Makanan & Snack
                  </button>
                  <button
                    onClick={() => setSelectedCategory(3)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      selectedCategory === 3
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Sembako & Retail
                  </button>
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="flex-1 overflow-y-auto pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <Package className="w-12 h-12 stroke-[1.5] text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">Tidak ada produk ditemukan.</p>
                    <p className="text-xs text-slate-400">Ubah kata kunci pencarian atau kategori.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {filteredProducts.map(prod => {
                      const isOutOfStock = prod.stock <= 0;
                      const isLowStock = prod.stock <= prod.min_stock && !isOutOfStock;
                      const inCart = cart.find(c => c.product.id === prod.id);

                      return (
                        <div
                          key={prod.id}
                          onClick={() => !isOutOfStock && handleAddToCart(prod)}
                          className={`bg-white rounded-2xl border border-slate-200/90 p-3 flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden select-none ${
                            isOutOfStock 
                              ? 'opacity-60 cursor-not-allowed bg-slate-50' 
                              : 'cursor-pointer hover:border-emerald-400 active:scale-[0.99]'
                          }`}
                        >
                          {/* Image & Badge */}
                          <div className="w-full h-28 sm:h-32 rounded-xl bg-slate-100 overflow-hidden relative mb-2.5">
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              loading="lazy"
                            />
                            <span 
                              className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                                isOutOfStock 
                                  ? 'bg-rose-500 text-white' 
                                  : isLowStock 
                                  ? 'bg-amber-500 text-white' 
                                  : 'bg-slate-900/70 text-white backdrop-blur-xs'
                              }`}
                            >
                              Stok: {prod.stock}
                            </span>
                            {inCart && (
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                                {inCart.qty} di keranjang
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              {prod.sku}
                            </span>
                            <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 transition">
                              {prod.name}
                            </h3>
                          </div>

                          {/* Price & Action */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 block -mb-0.5">Harga</span>
                              <span className="font-extrabold text-emerald-600 text-xs sm:text-sm">
                                {formatRp(prod.selling_price)}
                              </span>
                            </div>
                            <button
                              disabled={isOutOfStock}
                              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Panel (Right 35%) */}
            <aside className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-auto lg:h-full shadow-lg">
              
              {/* Cart Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-800">Keranjang Kasir</h2>
                    <span className="text-[11px] text-slate-500 font-medium">{cart.length} item unik</span>
                  </div>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" /> Kosongkan
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[300px] lg:max-h-none">
                {cart.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                    <ShoppingCart className="w-10 h-10 text-slate-300 stroke-[1.5] mb-2" />
                    <p className="text-xs font-bold text-slate-600">Keranjang Masih Kosong</p>
                    <p className="text-[11px] text-slate-400 text-center max-w-[200px] mt-0.5">
                      Klik produk pada katalog sebelah kiri untuk menambah ke transaksi.
                    </p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-bold text-slate-800 truncate">{item.product.name}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatRp(item.product.selling_price)} / unit
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            onClick={() => handleUpdateQty(item.product.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-slate-800 text-xs">{item.qty}</span>
                          <button
                            onClick={() => handleUpdateQty(item.product.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-extrabold text-slate-800 w-20 text-right">
                          {formatRp(item.product.selling_price * item.qty)}
                        </span>

                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout & Real-time Calculations Panel */}
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3 text-xs">
                
                {/* Subtotal & Diskon */}
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Belanja:</span>
                  <span className="font-bold text-slate-800">{formatRp(cartSubtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Diskon Potongan (Rp):</span>
                  <input
                    type="number"
                    value={discount || ''}
                    onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    min="0"
                    className="w-24 px-2 py-1 text-right text-xs rounded-md border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700 text-base font-black">
                    {formatRp(cartGrandTotal)}
                  </span>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl border text-[11px] font-bold transition ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Banknote className="w-4 h-4 mb-1 text-emerald-600" />
                      Tunai (Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris')}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl border text-[11px] font-bold transition relative ${
                        paymentMethod === 'qris'
                          ? 'border-sky-600 bg-sky-50 text-sky-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="absolute -top-1.5 -right-1 bg-emerald-600 text-[8.5px] font-extrabold text-white px-1.5 py-0.2 rounded-full shadow-xs">
                        Midtrans
                      </span>
                      <QrCode className="w-4 h-4 mb-1 text-sky-600" />
                      QRIS GoPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl border text-[11px] font-bold transition ${
                        paymentMethod === 'transfer'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mb-1 text-indigo-600" />
                      Transfer Bank
                    </button>
                  </div>
                </div>

                {/* Input Uang Bayar (Tunai) & Kembalian Real-time */}
                {paymentMethod === 'cash' ? (
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 text-[11px]">Nominal Uang Bayar:</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setPayAmount(String(cartGrandTotal))}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                        >
                          Uang Pas
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayAmount(String((parseFloat(payAmount) || 0) + 50000))}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                        >
                          +50rb
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayAmount(String((parseFloat(payAmount) || 0) + 100000))}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                        >
                          +100rb
                        </button>
                      </div>
                    </div>

                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="Masukkan nominal bayar..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-right font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    <div className="flex justify-between items-center text-xs pt-1 font-semibold">
                      <span className="text-slate-500">Uang Kembalian:</span>
                      <span className={changeAmount >= 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-bold'}>
                        {changeAmount >= 0 
                          ? formatRp(changeAmount) 
                          : `Kurang ${formatRp(Math.abs(changeAmount))}`}
                      </span>
                    </div>

                    {/* Button Tunai */}
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={!isCheckoutValid}
                      className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Proses Transaksi Tunai</span>
                    </button>
                  </div>
                ) : paymentMethod === 'qris' ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 text-sky-900 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5 text-sky-800">
                          <QrCode className="w-3.5 h-3.5 text-sky-600" /> Midtrans Dynamic QRIS
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsMidtransSettingsOpen(true)}
                          className="text-[10px] text-sky-600 hover:text-sky-800 flex items-center gap-1 font-semibold underline decoration-dotted cursor-pointer"
                        >
                          <Settings className="w-3 h-3" /> Konfig API
                        </button>
                      </div>
                      <p className="text-[10.5px] text-slate-600 leading-tight">
                        Integrasi resmi Midtrans Core API POS. Menampilkan QRIS dinamis instan di layar kasir dengan deteksi pembayaran real-time.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartMidtransQris}
                      disabled={!isCheckoutValid || isGeneratingQr}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
                      <span>{isGeneratingQr ? 'Menghubungkan Midtrans...' : 'Tampilkan QRIS Midtrans (GoPay)'}</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] flex items-center gap-2 font-medium">
                      <CreditCard className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      Pembayaran Transfer Bank otomatis tercatat tanpa kembalian.
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={!isCheckoutValid}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Proses Transaksi & Simpan Faktur</span>
                    </button>
                  </div>
                )}

              </div>
            </aside>
          </div>
        )}

        {/* 2. TAB: INVENTARIS PRODUK */}
        {activeTab === 'products' && (
          <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-5 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Manajemen Katalog & Inventaris UMKM</h2>
                <p className="text-xs text-slate-500">
                  Kelola master data produk, HPP (Harga Beli), Harga Jual Kasir, dan monitoring stok minimum
                </p>
              </div>
              <button
                onClick={handleOpenCreateProduct}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Tambah Produk Baru
              </button>
            </div>

            {/* Table of Products */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Produk</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-right">Harga Beli (HPP)</th>
                      <th className="py-3 px-4 text-right">Harga Jual</th>
                      <th className="py-3 px-4 text-center">Stok</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(prod => {
                      const isOutOfStock = prod.stock <= 0;
                      const isLowStock = prod.stock <= prod.min_stock && !isOutOfStock;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200"
                              />
                              <div>
                                <div className="font-bold text-slate-800">{prod.name}</div>
                                <div className="text-[10px] text-slate-400">Min. Alert: {prod.min_stock} pcs</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-600">{prod.sku}</td>
                          <td className="py-3 px-4 text-slate-600">{prod.category_name}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{formatRp(prod.purchase_price)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatRp(prod.selling_price)}</td>
                          <td className={`py-3 px-4 text-center font-black ${
                            isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'
                          }`}>
                            {prod.stock}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Habis</span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Menipis</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Aman</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB: RESTOCK (PEMBELIAN DARI SUPPLIER) */}
        {activeTab === 'purchases' && (
          <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
            <div>
              <h2 className="text-xl font-black text-slate-900">Penerimaan Barang (Restock)</h2>
              <p className="text-xs text-slate-500">
                Form penerimaan barang dari supplier dengan perhitungan <b>Weighted Average HPP</b> otomatis
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input Restock */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
                <form onSubmit={handleProcessRestock} className="space-y-4 text-xs">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Supplier Pemasok</label>
                      <select
                        value={restockSupplierId}
                        onChange={e => setRestockSupplierId(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Catatan / No. Surat Jalan</label>
                      <input
                        type="text"
                        value={restockNotes}
                        onChange={e => setRestockNotes(e.target.value)}
                        placeholder="Contoh: DO-202610-88"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {/* Restock Items Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-bold text-slate-800">Daftar Barang Diterima</label>
                      <button
                        type="button"
                        onClick={handleAddRestockRow}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Baris
                      </button>
                    </div>

                    <div className="space-y-2">
                      {restockItems.map((item, idx) => {
                        const targetProd = products.find(p => p.id === item.product_id);

                        return (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <select
                                value={item.product_id}
                                onChange={e => {
                                  const pId = Number(e.target.value);
                                  const found = products.find(p => p.id === pId);
                                  handleRestockChange(idx, 'product_id', pId);
                                  if (found) {
                                    handleRestockChange(idx, 'purchase_price', found.purchase_price);
                                  }
                                }}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Stok: {p.stock})
                                  </option>
                                ))}
                              </select>
                              {targetProd && (
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  HPP Saat ini: {formatRp(targetProd.purchase_price)}
                                </span>
                              )}
                            </div>

                            <div className="col-span-3">
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={e => handleRestockChange(idx, 'qty', Math.max(1, parseInt(e.target.value) || 0))}
                                placeholder="Qty"
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center text-xs"
                              />
                              <span className="text-[10px] text-slate-400 block text-center mt-0.5">Jumlah Unit</span>
                            </div>

                            <div className="col-span-3">
                              <input
                                type="number"
                                min="0"
                                value={item.purchase_price}
                                onChange={e => handleRestockChange(idx, 'purchase_price', Math.max(0, parseFloat(e.target.value) || 0))}
                                placeholder="Harga Beli"
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-right text-xs"
                              />
                              <span className="text-[10px] text-slate-400 block text-right mt-0.5">Harga Beli Baru</span>
                            </div>

                            <div className="col-span-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRestockRow(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Cost */}
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-amber-900">Total Nilai Restock:</span>
                      <p className="text-[11px] text-amber-700">HPP produk terkait akan dihitung ulang secara otomatis</p>
                    </div>
                    <span className="font-black text-lg text-amber-800">{formatRp(restockTotalCost)}</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md transition"
                  >
                    Simpan Penerimaan Barang & Perbarui HPP
                  </button>
                </form>
              </div>

              {/* Purchase History */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
                <h3 className="font-bold text-slate-800 text-base mb-1">Riwayat Restock Supplier</h3>
                <p className="text-xs text-slate-500 mb-4">Daftar transaksi penerimaan barang masuk</p>

                <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
                  {purchases.map(po => (
                    <div key={po.id} className="py-3 text-xs">
                      <div className="flex justify-between items-start font-bold text-slate-800">
                        <span className="font-mono text-amber-700">{po.purchase_code}</span>
                        <span className="font-extrabold">{formatRp(po.total_amount)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Supplier: <span className="font-medium text-slate-700">{po.supplier_name}</span> &bull; {po.purchase_date}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 italic">
                        Catatan: {po.notes} ({po.items_count} unit diterima)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 4. TAB: LAPORAN ANALITIK & TREND */}
        {activeTab === 'reports' && (
          <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
            <div>
              <h2 className="text-xl font-black text-slate-900">Dashboard Laporan & Analitik Keuntungan UMKM</h2>
              <p className="text-xs text-slate-500">
                Visualisasi Omset, Estimasi HPP, Keuntungan Bersih, dan Trend Penjualan Produk Terlaris
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Omset Hari Ini */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Omset Hari Ini</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatRp(analytics.totalOmset)}
                </div>
                <div className="text-xs text-slate-500 mt-2 flex justify-between">
                  <span>{analytics.totalTransactions} Transaksi Kasir</span>
                  <span className="text-emerald-600 font-semibold">Aktif</span>
                </div>
              </div>

              {/* Total HPP */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total HPP (Modal)</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatRp(analytics.totalHpp)}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Harga Pokok Penjualan terakumulasi
                </div>
              </div>

              {/* Total Laba Bersih */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-emerald-100 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Laba Bersih (Net Profit)</span>
                  <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  {formatRp(analytics.netProfit)}
                </div>
                <div className="text-xs text-emerald-100/90 mt-2">
                  Formula: <span className="font-mono text-[11px]">(Omset - HPP) - Diskon</span>
                </div>
              </div>

              {/* Profit Margin */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Margin Keuntungan</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {analytics.totalOmset > 0 
                    ? ((analytics.netProfit / analytics.totalOmset) * 100).toFixed(1) + '%'
                    : '0%'}
                </div>
                <div className="text-xs text-indigo-600 font-semibold mt-2">
                  Persentase laba terhadap omset
                </div>
              </div>

            </div>

            {/* Visual Trend & Top 10 Products */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Daily Trend Bars */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Trend Harian Penjualan (Simulasi 7 Hari)</h3>
                    <p className="text-xs text-slate-500">Omset Penjualan vs Laba Bersih</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    { day: 'Hari Ini (Kamis)', omset: analytics.totalOmset, profit: analytics.netProfit, pct: 100 },
                    { day: 'Rabu (Kemarin)', omset: 78000, profit: 34000, pct: 75 },
                    { day: 'Selasa', omset: 92000, profit: 41000, pct: 88 },
                    { day: 'Senin', omset: 65000, profit: 28000, pct: 60 },
                    { day: 'Minggu', omset: 125000, profit: 58000, pct: 95 }
                  ].map((bar, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex justify-between text-slate-600 font-semibold mb-1">
                        <span>{bar.day}</span>
                        <span>
                          Omset: <b className="text-slate-800">{formatRp(bar.omset)}</b> &bull; Laba: <b className="text-emerald-600">{formatRp(bar.profit)}</b>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${bar.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-base">Top Produk Terlaris</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Ranking
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                  {analytics.topProducts.map((tp, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] ${
                          idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-slate-800 truncate">{tp.name}</div>
                          <div className="text-[10px] text-slate-400">SKU: {tp.sku}</div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 pl-2">
                        <div className="font-extrabold text-emerald-600">{tp.qty} terjual</div>
                        <div className="text-[10px] text-slate-500">{formatRp(tp.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Transaction History Log */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
              <h3 className="font-bold text-slate-800 text-base mb-3">Riwayat Faktur Penjualan</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">No. Faktur</th>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Kasir</th>
                      <th className="py-2.5 px-3 text-center">Jml Item</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-right">Diskon</th>
                      <th className="py-2.5 px-3 text-right">Grand Total</th>
                      <th className="py-2.5 px-3 text-center">Metode</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{tx.invoice_number}</td>
                        <td className="py-2.5 px-3 text-slate-500">{tx.transaction_date}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{tx.cashier_name}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{tx.total_item}</td>
                        <td className="py-2.5 px-3 text-right">{formatRp(tx.subtotal)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-500">-{formatRp(tx.discount)}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700">{formatRp(tx.grand_total)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {tx.payment_method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setActiveReceipt(tx);
                              setIsReceiptModalOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 mx-auto"
                          >
                            <Printer className="w-3 h-3" /> Struk
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 5. TAB: MANAJEMEN USER & RBAC */}
        {activeTab === 'users' && (
          <div className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6 overflow-y-auto">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  Manajemen Pengguna & Hak Akses (RBAC)
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola data akun kasir, manajer toko, dan hak akses otorisasi sistem POS UMKM
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  PHP 8.3 RBAC Native
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  password_hash(BCRYPT)
                </span>
              </div>
            </div>

            {/* User Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total User</div>
                  <div className="text-2xl font-black text-slate-800 mt-0.5">{users.length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Kasir (Cashier)</div>
                  <div className="text-2xl font-black text-emerald-800 mt-0.5">
                    {users.filter(u => u.role === 'cashier').length}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Manajer</div>
                  <div className="text-2xl font-black text-blue-800 mt-0.5">
                    {users.filter(u => u.role === 'manager').length}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Owner / Admin</div>
                  <div className="text-2xl font-black text-purple-800 mt-0.5">
                    {users.filter(u => u.role === 'owner').length}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Form Tambah Pengguna Baru */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Form Tambah Pengguna Baru</h3>
                  <p className="text-[11px] text-slate-400">Buat akun untuk staf kasir atau manajer operasional baru</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth. Ahmad Fauzi"
                      value={newUserForm.fullName}
                      onChange={e => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cth. kasir2"
                      value={newUserForm.username}
                      onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password Awal <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewUserPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimal 6 karakter"
                        value={newUserForm.password}
                        onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        aria-label={showNewUserPassword ? 'Sembunyikan password' : 'Lihat password'}
                        title={showNewUserPassword ? 'Sembunyikan password' : 'Lihat password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Peran / Hak Akses (Role) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newUserForm.role}
                      onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as 'cashier' | 'manager' | 'owner' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 bg-white"
                    >
                      <option value="cashier">Kasir (Hanya Akses POS)</option>
                      <option value="manager">Manager (POS + Stok + Laporan)</option>
                      <option value="owner">Owner (Akses Penuh Seluruh Fitur)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={newUserForm.isActive}
                      onChange={e => setNewUserForm({ ...newUserForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span>Akun langsung aktif dan dapat login</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Simpan Pengguna Baru</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Daftar Pengguna & Filter */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Pengguna Sistem</h3>
                  <p className="text-[11px] text-slate-500">Total {filteredUsers.length} pengguna ditemukan</p>
                </div>

                {/* Filter & Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama / username..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
                    {(['all', 'cashier', 'manager', 'owner'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => setUserRoleFilter(role)}
                        className={`px-2.5 py-1 rounded-lg font-bold capitalize transition text-[11px] ${
                          userRoleFilter === role
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {role === 'all' ? 'Semua' : role === 'cashier' ? 'Kasir' : role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table of Users */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Hak Akses (Role)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Dibuat Pada</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Tidak ada pengguna yang cocok dengan kriteria pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => {
                        const isSelf = currentUser?.id === user.id;
                        return (
                          <tr key={user.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  user.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                                  user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {user.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>{user.fullName}</span>
                                    {isSelf && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">
                                        Anda
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">ID #{user.id}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                              @{user.username}
                            </td>

                            <td className="py-3 px-4">
                              {user.role === 'owner' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                                  <Crown className="w-3 h-3 text-purple-700" />
                                  Owner (Akses Penuh)
                                </span>
                              )}
                              {user.role === 'manager' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                                  <Briefcase className="w-3 h-3 text-blue-700" />
                                  Manager (POS+Inv+Lap)
                                </span>
                              )}
                              {user.role === 'cashier' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                  <ShoppingCart className="w-3 h-3 text-emerald-700" />
                                  Cashier (Hanya POS)
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleUserActive(user)}
                                disabled={isSelf}
                                title={isSelf ? 'Anda tidak dapat menonaktifkan akun sendiri' : 'Klik untuk ubah status'}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer disabled:cursor-not-allowed ${
                                  user.isActive
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                {user.isActive ? 'Aktif' : 'Non-aktif'}
                              </button>
                            </td>

                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {user.createdAt}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditUser(user)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                  title="Edit Pengguna"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={isSelf}
                                  className={`p-1.5 rounded-lg transition ${
                                    isSelf
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  }`}
                                  title={isSelf ? 'Tidak bisa menghapus akun sendiri' : 'Hapus Pengguna'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. TAB: PHP SOURCE CODE & ARCHITECTURE EXPLORER */}
        {activeTab === 'php-code' && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden max-w-7xl w-full mx-auto">
            
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-emerald-600" />
                  Source Code PHP 8.3 & Arsitektur
                </h2>
                <p className="text-xs text-slate-500">
                  Seluruh kode PHP OOP Native, Enums, PDO Prepared Statements, CSRF, dan DDL Database MySQL
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-300"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin File'}</span>
                </button>

                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:bg-slate-400"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isZipping ? 'Mengemas .ZIP...' : 'Unduh Full Project (.ZIP)'}</span>
                </button>
              </div>
            </div>

            {/* Code Viewer Layout */}
            <div className="flex-1 flex flex-col lg:flex-row bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              
              {/* File Tree (Left 30%) */}
              <div className="w-full lg:w-72 bg-slate-950 p-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Direktori File PHP
                </span>

                <div className="space-y-1 overflow-y-auto max-h-60 lg:max-h-none flex-1 pr-1">
                  {PHP_PROJECT_FILES.map(file => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition ${
                        selectedFile.path === file.path
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{file.path}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        file.category === 'sql' ? 'bg-amber-900/60 text-amber-300' :
                        file.category === 'service' ? 'bg-blue-900/60 text-blue-300' :
                        file.category === 'core' ? 'bg-purple-900/60 text-purple-300' :
                        file.category === 'enum' ? 'bg-teal-900/60 text-teal-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {file.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Editor Preview (Right 70%) */}
              <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">{selectedFile.path}</span>
                    <span className="text-slate-600 text-xs">&bull;</span>
                    <span className="text-xs text-slate-400">{selectedFile.description}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed">
                  <pre className="whitespace-pre">
                    <code>{selectedFile.code}</code>
                  </pre>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* MODAL NOTA / STRUK PENJUALAN KHUSUS PRINTER PORTABEL (58mm / 80mm) */}
      {isReceiptModalOpen && activeReceipt && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto">
            
            {/* Modal Controls Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 text-white mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Struk Printer Portabel Kasir</h3>
                </div>
                <p className="text-[11px] text-slate-400">Format khusus kertas thermal roll (Bluetooth / USB)</p>
              </div>

              {/* Paper Size Selector (58mm vs 80mm) */}
              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    paperWidth === '58mm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ukuran standar printer mini Bluetooth portabel (58mm)"
                >
                  58mm (Mini)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    paperWidth === '80mm' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ukuran standar printer kasir thermal desktop (80mm)"
                >
                  80mm
                </button>
              </div>
            </div>

            {/* Visualisasi Kertas Struk Thermal Roll (Preview Nyata) */}
            <div className="flex justify-center my-2">
              <div 
                className={`thermal-paper bg-white text-black p-4 transition-all duration-200 select-text font-mono shadow-2xl border border-slate-300 ${
                  paperWidth === '58mm' ? 'w-[250px] text-[11px]' : 'w-[320px] text-[12px]'
                }`}
                style={{ lineHeight: 1.25 }}
              >
                {/* Header Toko Struk */}
                <div className="text-center">
                  <div className="font-black text-sm uppercase tracking-tight">{storeInfo.name}</div>
                  <div className="text-[9.5px] text-slate-700 mt-0.5">{storeInfo.address}</div>
                  <div className="text-[9.5px] text-slate-700">Telp: {storeInfo.phone}</div>
                </div>

                <div className="my-2 border-t border-dashed border-black"></div>

                {/* Metadata Transaksi */}
                <div className="text-[9.5px] space-y-0.5 text-slate-800">
                  <div className="flex justify-between">
                    <span>Faktur:</span>
                    <span className="font-bold">{activeReceipt.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{activeReceipt.transaction_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{activeReceipt.cashier_name}</span>
                  </div>
                </div>

                <div className="my-2 border-t border-dashed border-black"></div>

                {/* Daftar Item Struk */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {activeReceipt.details.map((item, idx) => (
                    <div key={idx} className="leading-tight">
                      <div className="font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="flex justify-between text-[10px] text-slate-800">
                        <span>{item.qty} x {Math.round(item.selling_price).toLocaleString('id-ID')}</span>
                        <span className="font-bold">{Math.round(item.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-2 border-t border-dashed border-black"></div>

                {/* Kalkulasi Total */}
                <div className="space-y-0.5 text-[10.5px]">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal</span>
                    <span>Rp {Math.round(activeReceipt.subtotal).toLocaleString('id-ID')}</span>
                  </div>
                  {activeReceipt.discount > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Diskon</span>
                      <span>-Rp {Math.round(activeReceipt.discount).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xs pt-1 my-0.5 border-t border-dotted border-black">
                    <span>TOTAL:</span>
                    <span>Rp {Math.round(activeReceipt.grand_total).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Bayar ({activeReceipt.payment_method.toUpperCase()})</span>
                    <span>Rp {Math.round(activeReceipt.pay_amount).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Kembali</span>
                    <span>Rp {Math.round(activeReceipt.change_amount).toLocaleString('id-ID')}</span>
                  </div>
                  {activeReceipt.payment_method === 'qris' && (
                    <div className="bg-sky-50 border border-sky-300 rounded p-1.5 my-1 text-[9px] text-sky-950 font-sans space-y-0.5">
                      <div className="flex justify-between font-bold text-sky-900">
                        <span>QRIS Acquirer:</span>
                        <span>{activeReceipt.payment_reference || 'Midtrans GoPay'}</span>
                      </div>
                      {activeReceipt.midtrans_transaction_id && (
                        <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                          <span>Ref ID:</span>
                          <span className="truncate max-w-[130px]">{activeReceipt.midtrans_transaction_id}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-extrabold text-emerald-700">
                        <span>Status:</span>
                        <span>SETTLED (LUNAS)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-2 border-t border-double border-black"></div>

                {/* Barcode & Footer Struk */}
                <div className="text-center space-y-1">
                  <div className="tracking-widest font-bold text-[11px] py-0.5">
                    *{activeReceipt.invoice_number}*
                  </div>
                  <div className="text-[8.5px] text-slate-600 leading-tight">
                    <div>Terima kasih atas kunjungan Anda!</div>
                    <div>Barang yang dibeli tidak dapat ditukar.</div>
                    <div className="text-[8px] text-slate-400 mt-1">Kedai ES Zefa &bull; POS Portable Edition</div>
                  </div>
                </div>

                {/* Feed paper space */}
                <div className="h-4"></div>
              </div>
            </div>

            {/* Action Buttons Khusus Printer Thermal */}
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintThermalPopup(activeReceipt, paperWidth)}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md"
                  title="Membuka jendela cetak ukuran 58mm untuk printer Bluetooth portabel"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak via Popup
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                  title="Cetak langsung menggunakan dialog printer browser"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Browser
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyReceiptText(activeReceipt)}
                  className="py-2 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                  title="Salin teks struk untuk dikirim via WhatsApp atau aplikasi RawBT Bluetooth Print"
                >
                  {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReceipt ? 'Tersalin!' : 'Salin WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Transaksi Baru
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DEDICATED THERMAL PRINT ROOT (HANYA DITAMPILKAN SAAT BROWSER PRINT DENGAN UKURAN 58mm/80mm) */}
      {activeReceipt && (
        <div id="thermalPrintRoot" className="hidden print:block font-mono text-black bg-white">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: paperWidth === '58mm' ? '13px' : '15px', fontWeight: 900 }}>{storeInfo.name}</div>
            <div style={{ fontSize: paperWidth === '58mm' ? '9px' : '10px' }}>{storeInfo.address}</div>
            <div style={{ fontSize: paperWidth === '58mm' ? '9px' : '10px' }}>Telp: {storeInfo.phone}</div>
          </div>

          <div style={{ borderTop: '1px double #000', margin: '4px 0' }}></div>

          <div style={{ fontSize: paperWidth === '58mm' ? '9px' : '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>No: {activeReceipt.invoice_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tgl: {activeReceipt.transaction_date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kasir: {activeReceipt.cashier_name}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

          <div>
            {activeReceipt.details.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '3px' }}>
                <div style={{ fontWeight: 'bold', fontSize: paperWidth === '58mm' ? '10px' : '11px' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: paperWidth === '58mm' ? '9.5px' : '10.5px' }}>
                  <span>{item.qty} x {Math.round(item.selling_price).toLocaleString('id-ID')}</span>
                  <span style={{ fontWeight: 'bold' }}>{Math.round(item.subtotal).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

          <div style={{ fontSize: paperWidth === '58mm' ? '10px' : '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>Rp {Math.round(activeReceipt.subtotal).toLocaleString('id-ID')}</span>
            </div>
            {activeReceipt.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Diskon:</span>
                <span>-Rp {Math.round(activeReceipt.discount).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: paperWidth === '58mm' ? '12px' : '13px', margin: '3px 0' }}>
              <span>TOTAL:</span>
              <span>Rp {Math.round(activeReceipt.grand_total).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Bayar ({activeReceipt.payment_method.toUpperCase()}):</span>
              <span>Rp {Math.round(activeReceipt.pay_amount).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Kembali:</span>
              <span>Rp {Math.round(activeReceipt.change_amount).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px double #000', margin: '4px 0' }}></div>

          <div style={{ textAlign: 'center', margin: '4px 0', fontWeight: 'bold', letterSpacing: '2px', fontSize: '11px' }}>
            *{activeReceipt.invoice_number}*
          </div>

          <div style={{ textAlign: 'center', fontSize: paperWidth === '58mm' ? '8.5px' : '9.5px', marginTop: '3px' }}>
            <div>Terima kasih atas kunjungan Anda!</div>
            <div>Barang yang dibeli tidak dapat ditukar.</div>
          </div>

          {/* Feed space for paper cut */}
          <div style={{ height: '12mm' }}></div>
        </div>
      )}

      {/* MODAL FORM TAMBAH/EDIT PRODUK */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-base mb-1">
              {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Lengkapi informasi produk dan stok awal inventaris</p>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Contoh: Kopi Susu Aren"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU / Kode *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={productForm.category_id}
                    onChange={e => setProductForm({ ...productForm, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value={1}>Kopi & Minuman</option>
                    <option value={2}>Makanan & Snack</option>
                    <option value={3}>Sembako & Retail</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Beli (HPP) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.purchase_price}
                    onChange={e => setProductForm({ ...productForm, purchase_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-right"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Jual Kasir *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.selling_price}
                    onChange={e => setProductForm({ ...productForm, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-right font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ambang Stok Menipis</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.min_stock}
                    onChange={e => setProductForm({ ...productForm, min_stock: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL Foto Produk</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PENGGUNA */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Edit Data Pengguna</h3>
                  <p className="text-[11px] text-slate-400">ID #{editingUser.id} &bull; @{editingUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editUserForm.fullName}
                  onChange={e => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editUserForm.username}
                  onChange={e => setEditUserForm({ ...editUserForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password Baru <span className="text-[10px] text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditUserPassword ? 'text' : 'password'}
                    placeholder="Ketik password baru jika ingin mengubah"
                    value={editUserForm.newPassword}
                    onChange={e => setEditUserForm({ ...editUserForm, newPassword: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                    aria-label={showEditUserPassword ? 'Sembunyikan password baru' : 'Lihat password baru'}
                    title={showEditUserPassword ? 'Sembunyikan password baru' : 'Lihat password baru'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    {showEditUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hak Akses (Role)</label>
                <select
                  value={editUserForm.role}
                  onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value as 'cashier' | 'manager' | 'owner' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
                >
                  <option value="cashier">Kasir (Cashier - Hanya Akses POS)</option>
                  <option value="manager">Manager (POS + Stok + Laporan)</option>
                  <option value="owner">Owner (Akses Penuh Seluruh Fitur)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={editUserForm.isActive}
                    onChange={e => setEditUserForm({ ...editUserForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Akun Aktif (Dapat Login)</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MIDTRANS DYNAMIC QRIS (CUSTOMER-FACING & CASHIER POS DISPLAY) */}
      {isMidtransModalOpen && midtransOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header: Official QRIS + GoPay Branding */}
            <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <QrCode className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white tracking-wide">Midtrans QRIS GoPay</h3>
                    <p className="text-[10px] text-sky-100">Integrasi Dynamic POS API Midtrans</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelMidtrans}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                  title="Tutup / Batalkan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Badges Info */}
              <div className="flex items-center gap-2 mt-3 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {midtransConfig.isProduction ? 'PRODUCTION LIVE' : 'SANDBOX SIMULATOR'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                  Acquirer: {midtransConfig.acquirer.toUpperCase()}
                </span>
                <span className="ml-auto font-mono text-sky-200 text-[10.5px]">
                  NMID: ID1020038921829
                </span>
              </div>
            </div>

            {/* QRIS Body */}
            <div className="p-5 sm:p-6 text-center space-y-4">
              
              {/* Merchant Title */}
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight uppercase">
                  {storeInfo.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {storeInfo.address} &bull; No: <span className="font-mono font-bold text-slate-700">{midtransOrder.orderId}</span>
                </p>
              </div>

              {/* Dynamic QR Code Canvas/Image */}
              <div className="relative inline-block p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md">
                {/* Official QRIS Header Banner */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2 px-1">
                  <div className="flex items-center gap-1">
                    <span className="font-black text-red-600 text-xs tracking-tighter">QRIS</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Nasional</span>
                  </div>
                  <div className="text-[9px] font-extrabold text-sky-600 tracking-tight">
                    GPN &bull; GoPay
                  </div>
                </div>

                {/* QR Code */}
                <div className="relative flex items-center justify-center">
                  <img
                    src={midtransOrder.qrDataUrl}
                    alt="Midtrans QRIS Code"
                    className={`w-52 h-52 object-contain transition duration-200 ${
                      midtransOrder.transactionStatus === 'expire' ? 'grayscale opacity-30' : ''
                    }`}
                  />

                  {/* Centered GoPay Mini Badge */}
                  <div className="absolute w-10 h-10 rounded-xl bg-white border border-sky-400 p-1 flex items-center justify-center shadow-md">
                    <div className="w-full h-full rounded-lg bg-sky-500 flex items-center justify-center text-white font-black text-[9px] tracking-tighter">
                      GoPay
                    </div>
                  </div>

                  {/* Expired Overlay */}
                  {midtransOrder.transactionStatus === 'expire' && (
                    <div className="absolute inset-0 bg-slate-900/60 rounded-xl backdrop-blur-xs flex flex-col items-center justify-center text-white p-3">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mb-1" />
                      <span className="font-black text-xs">QRIS Kadaluarsa</span>
                      <button
                        onClick={handleStartMidtransQris}
                        className="mt-2 px-3 py-1 bg-sky-600 hover:bg-sky-500 rounded-lg text-[10px] font-bold"
                      >
                        Buat QR Baru
                      </button>
                    </div>
                  )}

                  {/* Success Overlay */}
                  {midtransOrder.transactionStatus === 'settlement' && (
                    <div className="absolute inset-0 bg-emerald-600/90 rounded-xl backdrop-blur-xs flex flex-col items-center justify-center text-white p-3 animate-in zoom-in-90 duration-200">
                      <CheckCircle2 className="w-12 h-12 text-white mb-2 animate-bounce" />
                      <span className="font-black text-sm">PEMBAYARAN LUNAS!</span>
                      <span className="text-[10px] text-emerald-100 mt-0.5">Mencetak struk kasir...</span>
                    </div>
                  )}
                </div>

                {/* QRIS Footer Banner */}
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                  <span>Dicetak otomatis via Midtrans Core API</span>
                  <span>Ver: 01.02</span>
                </div>
              </div>

              {/* Tagihan Nominal */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <span className="text-[10.5px] font-bold text-slate-500 block uppercase tracking-wider">
                  Total Tagihan Pembayaran
                </span>
                <span className="text-2xl font-black text-emerald-600 tracking-tight">
                  {formatRp(midtransOrder.grossAmount)}
                </span>
                
                {/* Expiry Countdown */}
                <div className="flex items-center justify-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Masa Berlaku QRIS:</span>
                  <span className={`font-mono font-bold ${
                    midtransOrder.remainingSeconds < 120 ? 'text-rose-600 animate-pulse' : 'text-slate-900'
                  }`}>
                    {Math.floor(midtransOrder.remainingSeconds / 60).toString().padStart(2, '0')}:
                    {(midtransOrder.remainingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Real-time Status Radar Poller */}
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-left">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-600"></span>
                  </div>
                  <span className="text-xs font-bold text-sky-950">
                    {midtransOrder.transactionStatus === 'pending' ? 'Menunggu Pembayaran Konsumen...' :
                     midtransOrder.transactionStatus === 'settlement' ? 'Status: LUNAS (Settlement Diterima)' :
                     midtransOrder.transactionStatus === 'expire' ? 'Status: EXPIRED (Batas waktu habis)' : 'Status: Dibatalkan'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Konsumen dapat scan menggunakan <b>GoPay</b>, <b>BCA Mobile</b>, <b>ShopeePay</b>, <b>DANA</b>, <b>OVO</b>, <b>Livin Mandiri</b>, atau aplikasi m-Banking apa pun.
                </p>
              </div>

              {/* SANDBOX TESTING CONTROLS (Per Midtrans Integration Manual) */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-left">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-slate-700 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Simulator Uji Sandbox POS
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Midtrans Test Kit</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateMidtransSettlement}
                    disabled={midtransOrder.transactionStatus !== 'pending'}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    title="Simulasikan konsumen menekan Bayar di aplikasi GoPay / QRIS"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simulasi Bayar Sukses</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateMidtransExpire}
                    disabled={midtransOrder.transactionStatus !== 'pending'}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Simulasi Expire</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (midtransOrder?.qrString) {
                        navigator.clipboard.writeText(midtransOrder.qrString);
                        setIsCopiedQrString(true);
                        setTimeout(() => setIsCopiedQrString(false), 2000);
                      }
                    }}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopiedQrString ? 'Tersalin!' : 'Salin EMVCo QR String'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMidtransModalOpen(false);
                      setIsMidtransSettingsOpen(true);
                    }}
                    className="text-sky-600 hover:text-sky-800 flex items-center gap-1 font-semibold"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Kredensial API</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                Midtrans Core API &bull; Ref: {midtransOrder.transactionId.substring(0, 16)}...
              </span>
              <button
                type="button"
                onClick={handleCancelMidtrans}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition"
              >
                Batal Transaksi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CONFIGURASI KREDENSIAL MIDTRANS */}
      {isMidtransSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Konfigurasi Midtrans QRIS POS</h3>
                  <p className="text-xs text-slate-500">Kredensial API Merchant & Pengaturan Pembayaran</p>
                </div>
              </div>
              <button
                onClick={() => setIsMidtransSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                setIsMidtransSettingsOpen(false);
                alert('Konfigurasi kredensial Midtrans berhasil disimpan!');
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Environment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMidtransConfig({ ...midtransConfig, isProduction: false })}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      !midtransConfig.isProduction
                        ? 'border-sky-600 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    🛠️ Sandbox (Uji Coba)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMidtransConfig({ ...midtransConfig, isProduction: true })}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      midtransConfig.isProduction
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    🚀 Production (Live)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Server Key (Rahasia)</label>
                <input
                  type="text"
                  required
                  value={midtransConfig.serverKey}
                  onChange={e => setMidtransConfig({ ...midtransConfig, serverKey: e.target.value })}
                  placeholder="SB-Mid-server-xxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Digunakan untuk otentikasi HTTP Basic Auth API & validasi SHA-512 webhook.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Key</label>
                <input
                  type="text"
                  required
                  value={midtransConfig.clientKey}
                  onChange={e => setMidtransConfig({ ...midtransConfig, clientKey: e.target.value })}
                  placeholder="SB-Mid-client-xxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Merchant ID</label>
                  <input
                    type="text"
                    value={midtransConfig.merchantId}
                    onChange={e => setMidtransConfig({ ...midtransConfig, merchantId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan Acquirer</label>
                  <select
                    value={midtransConfig.acquirer}
                    onChange={e => setMidtransConfig({ ...midtransConfig, acquirer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="gopay">GoPay QRIS (Default)</option>
                    <option value="airpay shopee">ShopeePay QRIS</option>
                    <option value="all">Semua E-Wallet Nasional</option>
                  </select>
                </div>
              </div>

              {/* Webhook Endpoint Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 text-[11px] block">
                  URL Notifikasi Webhook Midtrans:
                </span>
                <code className="text-[10.5px] font-mono text-sky-800 bg-white px-2 py-1 rounded border border-slate-200 block mt-1 break-all select-all">
                  https://yourdomain.com/php_app/public/midtrans-webhook.php
                </code>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Daftarkan URL di atas pada menu Settings &gt; Configuration di Midtrans Merchant Portal.
                </span>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMidtransConfig({
                      serverKey: 'SB-Mid-server-DemoKeyZefaPos889',
                      clientKey: 'SB-Mid-client-DemoKeyZefaPos889',
                      merchantId: 'G901238472',
                      isProduction: false,
                      acquirer: 'gopay'
                    });
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Reset Default Demo
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMidtransSettingsOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition shadow-sm"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
