import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type LanguageCode = 'en' | 'ur' | 'hi' | 'fr' | 'ru' | 'de' | 'ro';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  label: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export interface CountryOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  continent: string;
  defaultLanguage: LanguageCode;
  dialCode: string;
  emergencyContacts: {
    police: string;
    fire: string;
    ambulance: string;
  };
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    label: 'English (International)',
    dir: 'ltr',
    flag: '🇬🇧'
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    label: 'Urdu (اردو)',
    dir: 'rtl',
    flag: '🇵🇰'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    label: 'Hindi (हिन्दी)',
    dir: 'ltr',
    flag: '🇮🇳'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    label: 'French (Français)',
    dir: 'ltr',
    flag: '🇫🇷'
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    label: 'Russian (Русский)',
    dir: 'ltr',
    flag: '🇷🇺'
  },
  {
    code: 'de',
    name: 'German (Germanish)',
    nativeName: 'Deutsch',
    label: 'Germanish / Deutsch',
    dir: 'ltr',
    flag: '🇩🇪'
  },
  {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    label: 'Romanian (Română)',
    dir: 'ltr',
    flag: '🇷🇴'
  }
];

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  {
    code: 'PK',
    name: 'Pakistan',
    nativeName: 'پاکستان',
    flag: '🇵🇰',
    continent: 'Asia',
    defaultLanguage: 'ur',
    dialCode: '+92',
    emergencyContacts: { police: '15', fire: '16', ambulance: '1122' }
  },
  {
    code: 'US',
    name: 'United States',
    nativeName: 'United States',
    flag: '🇺🇸',
    continent: 'North America',
    defaultLanguage: 'en',
    dialCode: '+1',
    emergencyContacts: { police: '911', fire: '911', ambulance: '911' }
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    flag: '🇬🇧',
    continent: 'Europe',
    defaultLanguage: 'en',
    dialCode: '+44',
    emergencyContacts: { police: '999', fire: '999', ambulance: '999' }
  },
  {
    code: 'IN',
    name: 'India',
    nativeName: 'भारत',
    flag: '🇮🇳',
    continent: 'Asia',
    defaultLanguage: 'hi',
    dialCode: '+91',
    emergencyContacts: { police: '100', fire: '101', ambulance: '102' }
  },
  {
    code: 'FR',
    name: 'France',
    nativeName: 'France',
    flag: '🇫🇷',
    continent: 'Europe',
    defaultLanguage: 'fr',
    dialCode: '+33',
    emergencyContacts: { police: '17', fire: '18', ambulance: '15' }
  },
  {
    code: 'RU',
    name: 'Russia',
    nativeName: 'Россия',
    flag: '🇷🇺',
    continent: 'Europe / Asia',
    defaultLanguage: 'ru',
    dialCode: '+7',
    emergencyContacts: { police: '102', fire: '101', ambulance: '103' }
  },
  {
    code: 'DE',
    name: 'Germany',
    nativeName: 'Deutschland',
    flag: '🇩🇪',
    continent: 'Europe',
    defaultLanguage: 'de',
    dialCode: '+49',
    emergencyContacts: { police: '110', fire: '112', ambulance: '112' }
  },
  {
    code: 'RO',
    name: 'Romania',
    nativeName: 'România',
    flag: '🇷🇴',
    continent: 'Europe',
    defaultLanguage: 'ro',
    dialCode: '+40',
    emergencyContacts: { police: '112', fire: '112', ambulance: '112' }
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    nativeName: 'الإمارات',
    flag: '🇦🇪',
    continent: 'Asia',
    defaultLanguage: 'en',
    dialCode: '+971',
    emergencyContacts: { police: '999', fire: '997', ambulance: '998' }
  },
  {
    code: 'CA',
    name: 'Canada',
    nativeName: 'Canada',
    flag: '🇨🇦',
    continent: 'North America',
    defaultLanguage: 'en',
    dialCode: '+1',
    emergencyContacts: { police: '911', fire: '911', ambulance: '911' }
  }
];

// Society Names, Cities, Gates, and Common Terms translated across all 7 languages
const PHRASE_TRANSLATIONS: Record<Exclude<LanguageCode, 'en'>, Record<string, string>> = {
  ur: {
    // Society Names & Locations
    'Architect Society (AEECHS)': 'آرکیٹیکٹ سوسائٹی (AEECHS)',
    'Grand Horizon Palm Residency': 'گرینڈ ہورائزن پام ریزیڈنسی',
    'Green Valley Luxury Estates': 'گرین ویلی لگژری اسٹیٹس',
    'Islamabad': 'اسلام آباد',
    'Metropolis': 'میٹروپولس',
    'Pine Hills': 'پائن ہلز',
    'Pakistan': 'پاکستان',
    'Federal Capital Territory': 'وفاقی دارالحکومت',
    'Sindh / Southern District': 'سندھ / جنوبی ضلع',
    'Capital Territory': 'کیپیٹل ٹیریٹری',

    // Gates
    'Gate 1 (AEECHS Main Boulevard)': 'گیٹ 1 (AEECHS مین بلیوارڈ)',
    'Gate 2 (AEECHS Sector D Gate)': 'گیٹ 2 (AEECHS سیکٹر ڈی گیٹ)',
    'Gate 3 (AEECHS Executive Club Gate)': 'گیٹ 3 (AEECHS ایگزیکٹو کلب گیٹ)',
    'Main Gate (North)': 'مین گیٹ (شمال)',
    'Main Gate (North Boulevard)': 'مین گیٹ (نارتھ بلیوارڈ)',
    'Gate 2 (West Commercial)': 'گیٹ 2 (مغربی کمرشل)',
    'Service Gate (East)': 'سروس گیٹ (مشرق)',
    'VIP / Residents South Gate': 'وی آئی پی / رہائشی جنوبی گیٹ',
    'Gate 2 (South Perimeter)': 'گیٹ 2 (جنوبی پیری میٹر)',

    // Global & Role Titles
    'Secure 24 by 7': 'سیکیور 24 بائی 7',
    'SECURE 24 BY 7': 'سیکیور 24 بائی 7',
    'Security Guard': 'سیکیورٹی گارڈ',
    'Management': 'سوسائٹی مینجمنٹ',
    'SOCIETY MANAGEMENT': 'سوسائٹی مینجمنٹ',
    'Society Management': 'سوسائٹی مینجمنٹ',
    'Owner Suite': 'اونر سوئٹ',
    'OWNER MASTER SUITE': 'اونر ماسٹر سوئٹ',
    'OWNER MASTER PORTAL': 'اونر ماسٹر پورٹل',
    'RMP Portal': 'آر ایم پی پورٹل (RMP)',
    'RESIDENT MESSAGES PORTAL (RMP)': 'رہائشی میسجز پورٹل (RMP)',
    'Resident Messages Portal': 'رہائشی میسجز پورٹل',
    'Administrative Oversight Console': 'انتظامی نگرانی کنسول',
    'Executive Society Governance': 'ایگزیکٹو سوسائٹی گورننس',
    'MULTI-SOCIETY GOVERNANCE': 'ملٹی سوسائٹی گورننس',

    // Login Modals
    'Protected Portal': 'محفوظ پورٹل',
    'Management ID Verification': 'مینجمنٹ شناختی تصدیق',
    'VERIFIED': 'تصدیق شدہ',
    'Status: Cleared': 'اسٹیٹس: کلیئر',
    'Society Management Passcode': 'سوسائٹی مینجمنٹ پاس کوڈ',
    'Enter society management passcode...': 'سوسائٹی مینجمنٹ پاس کوڈ درج کریں...',
    'Authenticate & Enter Management': 'تصدیق کریں اور مینجمنٹ کھولیں',
    'Authenticate & Open Master Suite': 'تصدیق کریں اور ماسٹر سوئٹ کھولیں',
    'Verifying Credentials...': 'اسناد کی تصدیق ہو رہی ہے...',
    'Owner Master Password': 'اونر ماسٹر پاس ورڈ',
    'Enter owner master password...': 'اونر ماسٹر پاس ورڈ درج کریں...',
    'Backend Secret Managed': 'بیک اینڈ سیکیورٹی سے محفوظ',
    'Guard Duty Verification': 'گارڈ ڈیوٹی کی تصدیق',
    'Officer Login': 'گارڈ لاگ ان',
    'Owner Audit': 'اونر آڈٹ',
    'Mgmt Audit': 'مینجمنٹ آڈٹ',
    'Duty Access Code': 'ڈیوٹی ایکسیس کوڈ',
    'Verify & Open Gate Console': 'تصدیق کریں اور گیٹ کنسول کھولیں',
    'Select Assigned Gate': 'تفویض کردہ گیٹ منتخب کریں',
    'Select Duty Shift': 'ڈیوٹی شفٹ منتخب کریں',
    'MORNING': 'صبح کی شفٹ',
    'EVENING': 'شام کی شفٹ',
    'NIGHT': 'رات کی شفٹ',

    // Guard Dashboard Tabs & Actions
    'Quick Actions': 'فوری اقدامات',
    'Scan QR Pass': 'کیو آر پاس اسکین کریں',
    '4-Method Verify': '4 طریقوں سے تصدیق',
    'RMP Pre-Clearances': 'آر ایم پی پیشگی اجازت',
    'Vehicle Entry': 'گاڑی کا داخلہ',
    'Vehicle Exit': 'گاڑی کا اخراج',
    'Visitor Entry': 'مہمان کا داخلہ',
    'Delivery Log': 'ڈیلیوری ریکارڈ',
    'Service Staff': 'سروس اسٹاف',
    'Global Search': 'عالمی تلاش',
    'Gate Activity': 'گیٹ کی سرگرمی',
    'Shift Handover': 'شفٹ ہینڈ اوور',
    'Accountability': 'گارڈ احتساب ریکارڈ',
    'Gate AI Assistant': 'گیٹ اے آئی اسسٹنٹ',
    'OPEN BARRIER': 'بیریئر کھولیں',
    'CLOSE BARRIER': 'بیریئر بند کریں',
    'LOCKDOWN': 'ایمرجنسی لاک ڈاؤن',
    'BARRIER CLOSED': 'بیریئر بند ہے',
    'BARRIER OPEN': 'بیریئر کھلا ہے',
    'Emergency': 'ایمرجنسی',
    'Logout': 'لاگ آؤٹ',
    'Refresh': 'ریفریش',
    'Switch Gate': 'گیٹ تبدیل کریں',
    'Management Portal': 'مینجمنٹ پورٹل',
    'Inspect Guard Portal': 'گارڈ پورٹل کا معائنہ کریں',

    // Management Dashboard Tabs
    'Overview': 'مجموعی جائزہ',
    'OVERVIEW': 'مجموعی جائزہ',
    'Gates & Barriers': 'گیٹس اور بیریئرز',
    'GATES': 'گیٹس',
    'Vehicles': 'گاڑیاں',
    'VEHICLES': 'گاڑیاں',
    'Visitors': 'مہمان',
    'VISITORS': 'مہمان',
    'Houses & Residents': 'گھر اور رہائشی',
    'Resident Directory': 'رہائشی ڈائریکٹری',
    'HOUSES': 'رہائشی ڈائریکٹری',
    'Guards Roster': 'گارڈز کا ریکارڈ',
    'GUARDS': 'گارڈز',
    'Deliveries': 'ڈیلیوریز',
    'DELIVERIES': 'ڈیلیوریز',
    'Staff & Workers': 'سروس اسٹاف',
    'STAFF': 'اسٹاف',
    'Incidents': 'واقعات',
    'INCIDENTS': 'واقعات',
    'Alerts': 'سیکیورٹی الرٹس',
    'ALERTS': 'الرٹس',
    'Watchlist': 'واچ لسٹ (مشکوک فہرست)',
    'WATCHLIST': 'واچ لسٹ',
    'CCTV Grid': 'سی سی ٹی وی کیمرے',
    'CCTV': 'سی سی ٹی وی',
    'Parking': 'پارکنگ',
    'PARKING': 'پارکنگ',
    'Search': 'تلاش',
    'SEARCH': 'تلاش',
    'Secure AI': 'سیکیور اے آئی',
    'AI_ASSISTANT': 'اے آئی اسسٹنٹ',
    'Audit Logs': 'آڈٹ لاگز',
    'AUDIT': 'آڈٹ لاگز',
    'Reports': 'رپورٹس',
    'REPORTS': 'رپورٹس',

    // Owner Dashboard Tabs & Controls
    'Portfolio Overview': 'پورٹ فولیو کا جائزہ',
    'PORTFOLIO': 'پورٹ فولیو',
    'RESIDENTS': 'رہائشی',
    'HARDWARE': 'ہارڈویئر',
    'SYSTEM': 'سسٹم',
    'Select Society:': 'سوسائٹی منتخب کریں:',
    'All Societies': 'تمام سوسائٹیز',
    'Details': 'تفصیلات',
    'Check Every Detail of Active Society': 'فعال سوسائٹی کی مکمل تفصیلات دیکھیں',
    'Run Hardware Diagnostics': 'ہارڈویئر ڈائیگناسٹک چلائیں',

    // RMP Portal
    'Resident Portal Login': 'رہائشی پورٹل لاگ ان',
    'Society Resident Access Code': 'سوسائٹی ریزیڈنٹ ایکسیس کوڈ',
    'Personal RMP Code': 'ذاتی آر ایم پی کوڈ (RMP Code)',
    'Resident Full Name': 'رہائشی کا پورا نام',
    'Pre-Authorize Visitor / Generate Pass': 'مہمان کی پیشگی اجازت / پاس بنائیں',
    'New Pre-Notification': 'نئی پیشگی اطلاع',
    'Guest': 'مہمان',
    'GUEST': 'مہمان',
    'Delivery': 'ڈیلیوری',
    'DELIVERY': 'ڈیلیوری',
    'Service': 'سروس اسٹاف',
    'SERVICE_STAFF': 'سروس اسٹاف',

    // Common Statuses & Labels
    'ONLINE': 'آن لائن',
    'OFFLINE': 'آف لائن',
    'ON_DUTY': 'ڈیوٹی پر موجود',
    'ON_BREAK': 'وقفے پر',
    'INSIDE': 'سوسائٹی کے اندر',
    'OUTSIDE': 'سوسائٹی سے باہر',
    'ACTIVE': 'فعال',
    'EXCELLENT': 'بہترین',
    'GOOD': 'اچھا',
    'CLOSED': 'بند',
    'OPEN': 'کھلا',
    'APPROVED': 'منظور شدہ',
    'DENIED': 'مسترد شدہ',
    'UPCOMING': 'متوقع آمد',
    'Primary Resident': 'بنیادی رہائشی',
    'Co-Residents': 'شریک رہائشی (اہل خانہ)',
    'Cancel': 'منسوخ کریں',
    'Save': 'محفوظ کریں',
    'Close': 'بند کریں',
    'Done': 'مکمل'
  },

  hi: {
    // Society Names & Locations
    'Architect Society (AEECHS)': 'आर्किटेक्ट सोसायटी (AEECHS)',
    'Grand Horizon Palm Residency': 'ग्रैंड होराइजन पाम रेजीडेंसी',
    'Green Valley Luxury Estates': 'ग्रीन वैली लक्ज़री एस्टेट्स',
    'Islamabad': 'इस्लामाबाद',
    'Metropolis': 'मेट्रोपोलिस',
    'Pine Hills': 'पाइन हिल्स',
    'Pakistan': 'पाकिस्तान',
    'Federal Capital Territory': 'संघीय राजधानी क्षेत्र',
    'Sindh / Southern District': 'सिंध / दक्षिणी जिला',
    'Capital Territory': 'राजधानी क्षेत्र',

    // Gates
    'Gate 1 (AEECHS Main Boulevard)': 'गेट 1 (AEECHS मुख्य मार्ग)',
    'Gate 2 (AEECHS Sector D Gate)': 'गेट 2 (AEECHS सेक्टर डी गेट)',
    'Gate 3 (AEECHS Executive Club Gate)': 'गेट 3 (AEECHS एग्जीक्यूटिव क्लब गेट)',
    'Main Gate (North)': 'मुख्य गेट (उत्तर)',
    'Main Gate (North Boulevard)': 'मुख्य गेट (उत्तर मार्ग)',
    'Gate 2 (West Commercial)': 'गेट 2 (पश्चिम कमर्शियल)',
    'Service Gate (East)': 'सर्विस गेट (पूर्व)',
    'VIP / Residents South Gate': 'वीआईपी / निवासी दक्षिण गेट',
    'Gate 2 (South Perimeter)': 'गेट 2 (दक्षिण परिधि)',

    // Global & Role Titles
    'Secure 24 by 7': 'सिक्योर 24 बाय 7',
    'SECURE 24 BY 7': 'सिक्योर 24 बाय 7',
    'Security Guard': 'सुरक्षा गार्ड',
    'Management': 'सोसायटी प्रबंधन',
    'SOCIETY MANAGEMENT': 'सोसायटी प्रबंधन',
    'Society Management': 'सोसायटी प्रबंधन',
    'Owner Suite': 'ओनर सुइट',
    'OWNER MASTER SUITE': 'ओनर मास्टर सुइट',
    'OWNER MASTER PORTAL': 'ओनर मास्टर पोर्टल',
    'RMP Portal': 'RMP पोर्टल',
    'RESIDENT MESSAGES PORTAL (RMP)': 'निवासी संदेश पोर्टल (RMP)',
    'Resident Messages Portal': 'निवासी संदेश पोर्टल',
    'Administrative Oversight Console': 'प्रशासनिक निगरानी कंसोल',
    'Executive Society Governance': 'कार्यकारी सोसायटी प्रशासन',
    'MULTI-SOCIETY GOVERNANCE': 'मल्टी-सोसायटी प्रशासन',

    // Login Modals
    'Protected Portal': 'सुरक्षित पोर्टल',
    'Management ID Verification': 'प्रबंधन आईडी सत्यापन',
    'VERIFIED': 'सत्यापित',
    'Status: Cleared': 'स्थिति: स्वीकृत',
    'Society Management Passcode': 'सोसायटी प्रबंधन पासकोड',
    'Enter society management passcode...': 'सोसायटी प्रबंधन पासकोड दर्ज करें...',
    'Authenticate & Enter Management': 'सत्यापित करें और प्रबंधन खोलें',
    'Authenticate & Open Master Suite': 'सत्यापित करें और मास्टर सुइट खोलें',
    'Verifying Credentials...': 'प्रमाणपत्रों की जाँच हो रही है...',
    'Owner Master Password': 'ओनर मास्टर पासवर्ड',
    'Enter owner master password...': 'ओनर मास्टर पासवर्ड दर्ज करें...',
    'Guard Duty Verification': 'गार्ड ड्यूटी सत्यापन',
    'Officer Login': 'गार्ड लॉगिन',
    'Owner Audit': 'ओनर ऑडिट',
    'Mgmt Audit': 'प्रबंधन ऑडिट',
    'Duty Access Code': 'ड्यूटी एक्सेस कोड',
    'Verify & Open Gate Console': 'सत्यापित करें और गेट कंसोल खोलें',
    'Select Assigned Gate': 'निर्धारित गेट चुनें',
    'Select Duty Shift': 'ड्यूटी शिफ्ट चुनें',
    'MORNING': 'सुबह की शिफ्ट',
    'EVENING': 'शाम की शिफ्ट',
    'NIGHT': 'रात की शिफ्ट',

    // Guard & Management Tabs
    'Quick Actions': 'त्वरित कार्य',
    'Scan QR Pass': 'QR पास स्कैन करें',
    '4-Method Verify': '4-तरीकों से सत्यापन',
    'RMP Pre-Clearances': 'RMP पूर्व-अनुमति',
    'Vehicle Entry': 'वाहन प्रवेश',
    'Vehicle Exit': 'वाहन निकास',
    'Visitor Entry': 'आगंतुक प्रवेश',
    'Delivery Log': 'डिलीवरी लॉग',
    'Service Staff': 'सर्विस स्टाफ',
    'Global Search': 'वैश्विक खोज',
    'Gate Activity': 'गेट गतिविधि',
    'Shift Handover': 'शिफ्ट हैंडओवर',
    'Accountability': 'जवाबदेही ऑडिट',
    'Gate AI Assistant': 'गेट एआई सहायक',
    'OPEN BARRIER': 'बैरियर खोलें',
    'CLOSE BARRIER': 'बैरियर बंद करें',
    'LOCKDOWN': 'आपातकालीन लॉकडाउन',
    'BARRIER CLOSED': 'बैरियर बंद है',
    'BARRIER OPEN': 'बैरियर खुला है',
    'Emergency': 'आपातकालीन',
    'Logout': 'लॉग आउट',
    'Refresh': 'रीफ्रेश',
    'Switch Gate': 'गेट बदलें',
    'Management Portal': 'प्रबंधन पोर्टल',
    'Inspect Guard Portal': 'गार्ड पोर्टल का निरीक्षण करें',
    'Overview': 'अवलोकन',
    'Gates & Barriers': 'गेट्स और बैरियर',
    'Vehicles': 'वाहन',
    'Visitors': 'आगंतुक',
    'Houses & Residents': 'मकान और निवासी',
    'Resident Directory': 'निवासी निर्देशिका',
    'Guards Roster': 'गार्ड रोस्टर',
    'Deliveries': 'डिलीवरी',
    'Incidents': 'घटनाएँ',
    'Alerts': 'सुरक्षा अलर्ट',
    'Watchlist': 'वॉचलिस्ट',
    'CCTV Grid': 'सीसीटीवी ग्रिड',
    'Parking': 'पार्किंग',
    'Search': 'खोज',
    'Secure AI': 'सिक्योर एआई',
    'Audit Logs': 'ऑडिट लॉग',
    'Reports': 'रिपोर्ट',
    'Portfolio Overview': 'पोर्टफोलियो अवलोकन',
    'Select Society:': 'सोसायटी चुनें:',
    'All Societies': 'सभी सोसायटियाँ',
    'Details': 'विवरण',
    'Check Every Detail of Active Society': 'सक्रिय सोसायटी का पूरा विवरण देखें',
    'ONLINE': 'ऑनलाइन',
    'OFFLINE': 'ऑफ़लाइन',
    'ON_DUTY': 'ड्यूटी पर',
    'INSIDE': 'अंदर',
    'OUTSIDE': 'बाहर',
    'ACTIVE': 'सक्रिय',
    'EXCELLENT': 'उत्कृष्ट',
    'GOOD': 'अच्छा',
    'Cancel': 'रद्द करें',
    'Save': 'सहेजें',
    'Close': 'बंद करें',
    'Done': 'संपन्न'
  },

  fr: {
    // Society Names & Locations
    'Architect Society (AEECHS)': 'Résidence des Architectes (AEECHS)',
    'Grand Horizon Palm Residency': 'Résidence Grand Horizon Palm',
    'Green Valley Luxury Estates': 'Domaine de Luxe Green Valley',
    'Islamabad': 'Islamabad',
    'Metropolis': 'Métropole',
    'Pine Hills': 'Collines des Pins',
    'Pakistan': 'Pakistan',
    'Federal Capital Territory': 'Territoire de la Capitale Fédérale',
    'Sindh / Southern District': 'Sindh / District Sud',
    'Capital Territory': 'Territoire de la Capitale',

    // Gates
    'Gate 1 (AEECHS Main Boulevard)': 'Portail 1 (Boulevard Principal AEECHS)',
    'Gate 2 (AEECHS Sector D Gate)': 'Portail 2 (Secteur D AEECHS)',
    'Gate 3 (AEECHS Executive Club Gate)': 'Portail 3 (Club Exécutif AEECHS)',
    'Main Gate (North)': 'Portail Principal (Nord)',
    'Main Gate (North Boulevard)': 'Portail Principal (Boulevard Nord)',
    'Gate 2 (West Commercial)': 'Portail 2 (Zone Commerciale Ouest)',
    'Service Gate (East)': 'Portail de Service (Est)',
    'VIP / Residents South Gate': 'Portail Sud VIP / Résidents',
    'Gate 2 (South Perimeter)': 'Portail 2 (Périmètre Sud)',

    // Global & Role Titles
    'Secure 24 by 7': 'Secure 24 sur 7',
    'SECURE 24 BY 7': 'SECURE 24 SUR 7',
    'Security Guard': 'Garde de Sécurité',
    'Management': 'Administration',
    'SOCIETY MANAGEMENT': 'ADMINISTRATION DE LA RÉSIDENCE',
    'Society Management': 'Administration de la Résidence',
    'Owner Suite': 'Suite Propriétaire',
    'OWNER MASTER SUITE': 'SUITE PROPRIÉTAIRE MASTER',
    'OWNER MASTER PORTAL': 'PORTAIL MASTER PROPRIÉTAIRE',
    'RMP Portal': 'Portail RMP',
    'RESIDENT MESSAGES PORTAL (RMP)': 'PORTAIL DES MESSAGES RÉSIDENTS (RMP)',
    'Resident Messages Portal': 'Portail des Messages Résidents',
    'Administrative Oversight Console': 'Console de Supervision Administrative',
    'Executive Society Governance': 'Gouvernance Exécutive des Résidences',
    'MULTI-SOCIETY GOVERNANCE': 'GOUVERNANCE MULTI-RÉSIDENCES',

    // Login Modals
    'Protected Portal': 'Portail Protégé',
    'Management ID Verification': 'Vérification ID Administration',
    'VERIFIED': 'VÉRIFIÉ',
    'Status: Cleared': 'Statut : Autorisé',
    'Society Management Passcode': 'Code d’Accès Administration',
    'Enter society management passcode...': 'Entrez le code d’accès administration...',
    'Authenticate & Enter Management': 'Authentifier et Ouvrir l’Administration',
    'Authenticate & Open Master Suite': 'Authentifier et Ouvrir la Suite Master',
    'Verifying Credentials...': 'Vérification des identifiants...',
    'Owner Master Password': 'Mot de Passe Master Propriétaire',
    'Enter owner master password...': 'Entrez le mot de passe propriétaire...',
    'Guard Duty Verification': 'Vérification de Service Garde',
    'Officer Login': 'Connexion Garde',
    'Owner Audit': 'Audit Propriétaire',
    'Mgmt Audit': 'Audit Admin',
    'Duty Access Code': 'Code d’Accès de Service',
    'Verify & Open Gate Console': 'Vérifier et Ouvrir la Console Portail',
    'Select Assigned Gate': 'Sélectionner le Portail Assigné',
    'Select Duty Shift': 'Sélectionner le Quart de Service',
    'MORNING': 'MATIN',
    'EVENING': 'SOIR',
    'NIGHT': 'NUIT',

    // Guard & Management Tabs
    'Quick Actions': 'Actions Rapides',
    'Scan QR Pass': 'Scanner Pass QR',
    '4-Method Verify': 'Vérification 4-Méthodes',
    'RMP Pre-Clearances': 'Pré-Autorisations RMP',
    'Vehicle Entry': 'Entrée Véhicule',
    'Vehicle Exit': 'Sortie Véhicule',
    'Visitor Entry': 'Entrée Visiteur',
    'Delivery Log': 'Journal Livraisons',
    'Service Staff': 'Personnel de Service',
    'Global Search': 'Recherche Globale',
    'Gate Activity': 'Activité du Portail',
    'Shift Handover': 'Passation de Quart',
    'Accountability': 'Audit de Responsabilité',
    'Gate AI Assistant': 'Assistant IA Portail',
    'OPEN BARRIER': 'OUVRIR LA BARRIÈRE',
    'CLOSE BARRIER': 'FERMER LA BARRIÈRE',
    'LOCKDOWN': 'VERROUILLAGE D’URGENCE',
    'BARRIER CLOSED': 'BARRIÈRE FERMÉE',
    'BARRIER OPEN': 'BARRIÈRE OUVERTE',
    'Emergency': 'Urgence',
    'Logout': 'Déconnexion',
    'Refresh': 'Actualiser',
    'Switch Gate': 'Changer de Portail',
    'Management Portal': 'Portail Administration',
    'Inspect Guard Portal': 'Inspecter le Portail Garde',
    'Overview': 'Vue d’Ensemble',
    'Gates & Barriers': 'Portails et Barrières',
    'Vehicles': 'Véhicules',
    'Visitors': 'Visiteurs',
    'Houses & Residents': 'Maisons et Résidents',
    'Resident Directory': 'Annuaire des Résidents',
    'Guards Roster': 'Effectif des Gardes',
    'Deliveries': 'Livraisons',
    'Incidents': 'Incidents',
    'Alerts': 'Alertes de Sécurité',
    'Watchlist': 'Liste de Surveillance',
    'CCTV Grid': 'Grille Vidéosurveillance CCTV',
    'Parking': 'Stationnement',
    'Search': 'Rechercher',
    'Secure AI': 'IA Sécurisée',
    'Audit Logs': 'Journaux d’Audit',
    'Reports': 'Rapports',
    'Portfolio Overview': 'Vue du Portefeuille',
    'Select Society:': 'Choisir la Résidence :',
    'All Societies': 'Toutes les Résidences',
    'Details': 'Détails',
    'Check Every Detail of Active Society': 'Voir tous les détails de la résidence active',
    'ONLINE': 'EN LIGNE',
    'OFFLINE': 'HORS LIGNE',
    'ON_DUTY': 'EN SERVICE',
    'INSIDE': 'À L’INTÉRIEUR',
    'OUTSIDE': 'À L’EXTÉRIEUR',
    'ACTIVE': 'ACTIF',
    'EXCELLENT': 'EXCELLENT',
    'GOOD': 'BON',
    'Cancel': 'Annuler',
    'Save': 'Enregistrer',
    'Close': 'Fermer',
    'Done': 'Terminé'
  },

  ru: {
    // Society Names & Locations
    'Architect Society (AEECHS)': 'Жилой Комплекс Архитекторов (AEECHS)',
    'Grand Horizon Palm Residency': 'Резиденция Гранд Горизонт Палм',
    'Green Valley Luxury Estates': 'Элитный Комплекс Грин Вэлли',
    'Islamabad': 'Исламабад',
    'Metropolis': 'Метрополис',
    'Pine Hills': 'Пайн Хиллс',
    'Pakistan': 'Пакистан',
    'Federal Capital Territory': 'Федеральная столичная территория',
    'Sindh / Southern District': 'Синд / Южный округ',
    'Capital Territory': 'Столичный округ',

    // Gates
    'Gate 1 (AEECHS Main Boulevard)': 'Ворота 1 (Главный бульвар AEECHS)',
    'Gate 2 (AEECHS Sector D Gate)': 'Ворота 2 (Сектор D AEECHS)',
    'Gate 3 (AEECHS Executive Club Gate)': 'Ворота 3 (Клубный въезд AEECHS)',
    'Main Gate (North)': 'Главные ворота (Север)',
    'Main Gate (North Boulevard)': 'Главные ворота (Северный бульвар)',
    'Gate 2 (West Commercial)': 'Ворота 2 (Западный коммерческий)',
    'Service Gate (East)': 'Служебные ворота (Восток)',
    'VIP / Residents South Gate': 'Южные ворота VIP / Жители',
    'Gate 2 (South Perimeter)': 'Ворота 2 (Южный периметр)',

    // Global & Role Titles
    'Secure 24 by 7': 'Secure 24 на 7',
    'SECURE 24 BY 7': 'SECURE 24 НА 7',
    'Security Guard': 'Служба охраны',
    'Management': 'Управление (Админ)',
    'SOCIETY MANAGEMENT': 'УПРАВЛЕНИЕ КОМПЛЕКСОМ',
    'Society Management': 'Управление комплексом',
    'Owner Suite': 'Кабинет владельца',
    'OWNER MASTER SUITE': 'МАСТЕР-КАБИНЕТ ВЛАДЕЛЬЦА',
    'OWNER MASTER PORTAL': 'МАСТЕР-ПОРТАЛ ВЛАДЕЛЬЦА',
    'RMP Portal': 'Портал жителей (RMP)',
    'RESIDENT MESSAGES PORTAL (RMP)': 'ПОРТАЛ ЗАЯВОК ЖИТЕЛЕЙ (RMP)',
    'Resident Messages Portal': 'Портал заявок жителей',
    'Administrative Oversight Console': 'Консоль административного контроля',
    'Executive Society Governance': 'Исполнительное управление комплексами',
    'MULTI-SOCIETY GOVERNANCE': 'УПРАВЛЕНИЕ ОБЪЕКТАМИ',

    // Login Modals
    'Protected Portal': 'Защищенный портал',
    'Management ID Verification': 'Проверка ID администратора',
    'VERIFIED': 'ПОДТВЕРЖДЕНО',
    'Status: Cleared': 'Статус: Одобрено',
    'Society Management Passcode': 'Код доступа управления',
    'Enter society management passcode...': 'Введите код доступа управления...',
    'Authenticate & Enter Management': 'Авторизоваться и войти в Управление',
    'Authenticate & Open Master Suite': 'Авторизоваться и открыть Кабинет владельца',
    'Verifying Credentials...': 'Проверка учетных данных...',
    'Owner Master Password': 'Мастер-пароль владельца',
    'Enter owner master password...': 'Введите мастер-пароль владельца...',
    'Guard Duty Verification': 'Проверка дежурного охранника',
    'Officer Login': 'Вход охранника',
    'Owner Audit': 'Аудит владельца',
    'Mgmt Audit': 'Аудит управления',
    'Duty Access Code': 'Служебный код доступа',
    'Verify & Open Gate Console': 'Проверить и открыть пульт КПП',
    'Select Assigned Gate': 'Выберите назначенные ворота',
    'Select Duty Shift': 'Выберите смену дежурства',
    'MORNING': 'УТРЕННЯЯ',
    'EVENING': 'ВЕЧЕРНЯЯ',
    'NIGHT': 'НОЧНАЯ',

    // Guard & Management Tabs
    'Quick Actions': 'Быстрые действия',
    'Scan QR Pass': 'Сканировать QR-пропуск',
    '4-Method Verify': 'Проверка (4 метода)',
    'RMP Pre-Clearances': 'Предварительные заявки RMP',
    'Vehicle Entry': 'Въезд транспорта',
    'Vehicle Exit': 'Выезд транспорта',
    'Visitor Entry': 'Вход посетителя',
    'Delivery Log': 'Журнал доставок',
    'Service Staff': 'Сервисный персонал',
    'Global Search': 'Глобальный поиск',
    'Gate Activity': 'Активность на КПП',
    'Shift Handover': 'Передача смены',
    'Accountability': 'Отчетность охраны',
    'Gate AI Assistant': 'ИИ-помощник КПП',
    'OPEN BARRIER': 'ОТКРЫТЬ ШЛАГБАУМ',
    'CLOSE BARRIER': 'ЗАКРЫТЬ ШЛАГБАУМ',
    'LOCKDOWN': 'БЛОКИРОВКА КПП',
    'BARRIER CLOSED': 'ШЛАГБАУМ ЗАКРЫТ',
    'BARRIER OPEN': 'ШЛАГБАУМ ОТКРЫТ',
    'Emergency': 'Экстренный вызов',
    'Logout': 'Выйти',
    'Refresh': 'Обновить',
    'Switch Gate': 'Сменить ворота',
    'Management Portal': 'Портал управления',
    'Inspect Guard Portal': 'Проверить пульт охраны',
    'Overview': 'Обзор',
    'Gates & Barriers': 'Ворота и шлагбаумы',
    'Vehicles': 'Транспорт',
    'Visitors': 'Посетители',
    'Houses & Residents': 'Дома и жители',
    'Resident Directory': 'Реестр жителей',
    'Guards Roster': 'Штат охраны',
    'Deliveries': 'Доставки',
    'Incidents': 'Инциденты',
    'Alerts': 'Оповещения безопасности',
    'Watchlist': 'Черный список',
    'CCTV Grid': 'Камеры видеонаблюдения',
    'Parking': 'Парковка',
    'Search': 'Поиск',
    'Secure AI': 'ИИ Безопасности',
    'Audit Logs': 'Журнал аудита',
    'Reports': 'Отчеты',
    'Portfolio Overview': 'Обзор объектов',
    'Select Society:': 'Выберите комплекс:',
    'All Societies': 'Все комплексы',
    'Details': 'Подробнее',
    'Check Every Detail of Active Society': 'Просмотреть все данные активного комплекса',
    'ONLINE': 'ОНЛАЙН',
    'OFFLINE': 'ОФЛАЙН',
    'ON_DUTY': 'НА СМЕНЕ',
    'INSIDE': 'ВНУТРИ',
    'OUTSIDE': 'СНАРУЖИ',
    'ACTIVE': 'АКТИВЕН',
    'EXCELLENT': 'ОТЛИЧНО',
    'GOOD': 'ХОРОШО',
    'Cancel': 'Отмена',
    'Save': 'Сохранить',
    'Close': 'Закрыть',
    'Done': 'Готово'
  },

  de: {
    // Society Names & Locations
    'Architect Society (AEECHS)': 'Architekten-Wohnanlage (AEECHS)',
    'Grand Horizon Palm Residency': 'Grand Horizon Palm Residenz',
    'Green Valley Luxury Estates': 'Green Valley Luxus-Anwesen',
    'Islamabad': 'Islamabad',
    'Metropolis': 'Metropole',
    'Pine Hills': 'Pine Hills',
    'Pakistan': 'Pakistan',
    'Federal Capital Territory': 'Bundeshauptstadtterritorium',
    'Sindh / Southern District': 'Sindh / Südlicher Bezirk',
    'Capital Territory': 'Hauptstadtgebiet',

    // Gates
    'Gate 1 (AEECHS Main Boulevard)': 'Tor 1 (AEECHS Hauptboulevard)',
    'Gate 2 (AEECHS Sector D Gate)': 'Tor 2 (AEECHS Sektor D Tor)',
    'Gate 3 (AEECHS Executive Club Gate)': 'Tor 3 (AEECHS Executive-Club-Tor)',
    'Main Gate (North)': 'Haupttor (Nord)',
    'Main Gate (North Boulevard)': 'Haupttor (Nord-Boulevard)',
    'Gate 2 (West Commercial)': 'Tor 2 (Gewerbegebiet West)',
    'Service Gate (East)': 'Servicetor (Ost)',
    'VIP / Residents South Gate': 'VIP- / Bewohner-Südtor',
    'Gate 2 (South Perimeter)': 'Tor 2 (Südlicher Perimeter)',

    // Global & Role Titles
    'Secure 24 by 7': 'Secure 24 mal 7',
    'SECURE 24 BY 7': 'SECURE 24 MAL 7',
    'Security Guard': 'Sicherheitsdienst',
    'Management': 'Verwaltung (Admin)',
    'SOCIETY MANAGEMENT': 'WOHNANLAGEN-VERWALTUNG',
    'Society Management': 'Wohnanlagen-Verwaltung',
    'Owner Suite': 'Eigentümer-Suite',
    'OWNER MASTER SUITE': 'EIGENTÜMER-MASTER-SUITE',
    'OWNER MASTER PORTAL': 'EIGENTÜMER-MASTER-PORTAL',
    'RMP Portal': 'RMP-Portal',
    'RESIDENT MESSAGES PORTAL (RMP)': 'BEWOHNER-MELDUNGSPORTAL (RMP)',
    'Resident Messages Portal': 'Bewohner-Meldungsportal',
    'Administrative Oversight Console': 'Administrative Überwachungskonsole',
    'Executive Society Governance': 'Exekutive Wohnanlagen-Steuerung',
    'MULTI-SOCIETY GOVERNANCE': 'MULTI-ANLAGEN-STEUERUNG',

    // Login Modals
    'Protected Portal': 'Geschütztes Portal',
    'Management ID Verification': 'Verwaltungs-ID-Prüfung',
    'VERIFIED': 'VERIFIZIERT',
    'Status: Cleared': 'Status: Freigegeben',
    'Society Management Passcode': 'Verwaltungs-Zugangscode',
    'Enter society management passcode...': 'Verwaltungs-Zugangscode eingeben...',
    'Authenticate & Enter Management': 'Authentifizieren & Verwaltung öffnen',
    'Authenticate & Open Master Suite': 'Authentifizieren & Master-Suite öffnen',
    'Verifying Credentials...': 'Zugangsdaten werden geprüft...',
    'Owner Master Password': 'Eigentümer-Master-Passwort',
    'Enter owner master password...': 'Eigentümer-Master-Passwort eingeben...',
    'Guard Duty Verification': 'Wachdienst-Verifizierung',
    'Officer Login': 'Wach-Login',
    'Owner Audit': 'Eigentümer-Audit',
    'Mgmt Audit': 'Verwaltungs-Audit',
    'Duty Access Code': 'Dienst-Zugangscode',
    'Verify & Open Gate Console': 'Prüfen & Tor-Konsole öffnen',
    'Select Assigned Gate': 'Zugewiesenes Tor wählen',
    'Select Duty Shift': 'Dienstschicht wählen',
    'MORNING': 'FRÜHSCHICHT',
    'EVENING': 'SPÄTSCHICHT',
    'NIGHT': 'NACHTSCHICHT',

    // Guard & Management Tabs
    'Quick Actions': 'Schnellaktionen',
    'Scan QR Pass': 'QR-Pass scannen',
    '4-Method Verify': '4-Methoden-Prüfung',
    'RMP Pre-Clearances': 'RMP-Vorabfreigaben',
    'Vehicle Entry': 'Fahrzeugeinfahrt',
    'Vehicle Exit': 'Fahrzeugausfahrt',
    'Visitor Entry': 'Besuchereinlass',
    'Delivery Log': 'Lieferprotokoll',
    'Service Staff': 'Servicepersonal',
    'Global Search': 'Globale Suche',
    'Gate Activity': 'Tor-Aktivität',
    'Shift Handover': 'Schichtübergabe',
    'Accountability': 'Wach-Nachweis',
    'Gate AI Assistant': 'Tor-KI-Assistent',
    'OPEN BARRIER': 'SCHRANKE ÖFFNEN',
    'CLOSE BARRIER': 'SCHRANKE SCHLIESSEN',
    'LOCKDOWN': 'NOTFALL-SPERRUNG',
    'BARRIER CLOSED': 'SCHRANKE GESCHLOSSEN',
    'BARRIER OPEN': 'SCHRANKE OFFEN',
    'Emergency': 'Notruf',
    'Logout': 'Abmelden',
    'Refresh': 'Aktualisieren',
    'Switch Gate': 'Tor wechseln',
    'Management Portal': 'Verwaltungsportal',
    'Inspect Guard Portal': 'Wachportal prüfen',
    'Overview': 'Übersicht',
    'Gates & Barriers': 'Tore & Schranken',
    'Vehicles': 'Fahrzeuge',
    'Visitors': 'Besucher',
    'Houses & Residents': 'Häuser & Bewohner',
    'Resident Directory': 'Bewohnerverzeichnis',
    'Guards Roster': 'Wachdienstplan',
    'Deliveries': 'Lieferungen',
    'Incidents': 'Vorfälle',
    'Alerts': 'Sicherheitswarnungen',
    'Watchlist': 'Überwachungsliste',
    'CCTV Grid': 'CCTV-Kameraraster',
    'Parking': 'Parkplätze',
    'Search': 'Suche',
    'Secure AI': 'Secure KI',
    'Audit Logs': 'Audit-Protokolle',
    'Reports': 'Berichte',
    'Portfolio Overview': 'Portfolio-Übersicht',
    'Select Society:': 'Anlage wählen:',
    'All Societies': 'Alle Wohnanlagen',
    'Details': 'Details',
    'Check Every Detail of Active Society': 'Alle Details der aktiven Wohnanlage prüfen',
    'ONLINE': 'ONLINE',
    'OFFLINE': 'OFFLINE',
    'ON_DUTY': 'IM DIENST',
    'INSIDE': 'INNERHALB',
    'OUTSIDE': 'AUSSERHALB',
    'ACTIVE': 'AKTIV',
    'EXCELLENT': 'EXZELLENT',
    'GOOD': 'GUT',
    'Cancel': 'Abbrechen',
    'Save': 'Speichern',
    'Close': 'Schließen',
    'Done': 'Fertig'
  },

  ro: {
    // Society Names & Locations
    'Architect Society (AEECHS)': 'Complexul Arhitecților (AEECHS)',
    'Grand Horizon Palm Residency': 'Rezidența Grand Horizon Palm',
    'Green Valley Luxury Estates': 'Domeniul de Lux Green Valley',
    'Islamabad': 'Islamabad',
    'Metropolis': 'Metropolă',
    'Pine Hills': 'Dealurile Pinilor',
    'Pakistan': 'Pakistan',
    'Federal Capital Territory': 'Teritoriul Capitalei Federale',
    'Sindh / Southern District': 'Sindh / Districtul de Sud',
    'Capital Territory': 'Teritoriul Capitalei',

    // Gates
    'Gate 1 (AEECHS Main Boulevard)': 'Poarta 1 (Bulevardul Principal AEECHS)',
    'Gate 2 (AEECHS Sector D Gate)': 'Poarta 2 (Sectorul D AEECHS)',
    'Gate 3 (AEECHS Executive Club Gate)': 'Poarta 3 (Clubul Executiv AEECHS)',
    'Main Gate (North)': 'Poarta Principală (Nord)',
    'Main Gate (North Boulevard)': 'Poarta Principală (Bulevardul de Nord)',
    'Gate 2 (West Commercial)': 'Poarta 2 (Comercial Vest)',
    'Service Gate (East)': 'Poarta de Serviciu (Est)',
    'VIP / Residents South Gate': 'Poarta Sud VIP / Locatari',
    'Gate 2 (South Perimeter)': 'Poarta 2 (Perimetrul de Sud)',

    // Global & Role Titles
    'Secure 24 by 7': 'Secure 24 din 7',
    'SECURE 24 BY 7': 'SECURE 24 DIN 7',
    'Security Guard': 'Agent de Securitate',
    'Management': 'Administrație',
    'SOCIETY MANAGEMENT': 'ADMINISTRAȚIA COMPLEXULUI',
    'Society Management': 'Administrația Complexului',
    'Owner Suite': 'Suita Proprietarului',
    'OWNER MASTER SUITE': 'SUITA MASTER PROPRIETAR',
    'OWNER MASTER PORTAL': 'PORTAL MASTER PROPRIETAR',
    'RMP Portal': 'Portal RMP',
    'RESIDENT MESSAGES PORTAL (RMP)': 'PORTALUL MESAJELOR LOCATARILOR (RMP)',
    'Resident Messages Portal': 'Portalul Mesajelor Locatarilor',
    'Administrative Oversight Console': 'Consolă de Supraveghere Administrativă',
    'Executive Society Governance': 'Guvernanță Executivă a Complexului',
    'MULTI-SOCIETY GOVERNANCE': 'GUVERNANȚĂ MULTI-COMPLEX',

    // Login Modals
    'Protected Portal': 'Portal Protejat',
    'Management ID Verification': 'Verificare ID Administrație',
    'VERIFIED': 'VERIFICAT',
    'Status: Cleared': 'Statut: Aprobat',
    'Society Management Passcode': 'Cod de Acces Administrație',
    'Enter society management passcode...': 'Introduceți codul de acces administrație...',
    'Authenticate & Enter Management': 'Autentificare și Intrare în Administrație',
    'Authenticate & Open Master Suite': 'Autentificare și Deschidere Suită Master',
    'Verifying Credentials...': 'Se verifică datele de acces...',
    'Owner Master Password': 'Parolă Master Proprietar',
    'Enter owner master password...': 'Introduceți parola master proprietar...',
    'Guard Duty Verification': 'Verificare Tură Agent',
    'Officer Login': 'Autentificare Agent',
    'Owner Audit': 'Audit Proprietar',
    'Mgmt Audit': 'Audit Administrație',
    'Duty Access Code': 'Cod de Acces de Serviciu',
    'Verify & Open Gate Console': 'Verifică și Deschide Consola Porții',
    'Select Assigned Gate': 'Selectați Poarta Alocată',
    'Select Duty Shift': 'Selectați Tura de Serviciu',
    'MORNING': 'DIMINEAȚA',
    'EVENING': 'SEARA',
    'NIGHT': 'NOAPTEA',

    // Guard & Management Tabs
    'Quick Actions': 'Acțiuni Rapide',
    'Scan QR Pass': 'Scanează Permis QR',
    '4-Method Verify': 'Verificare 4 Metode',
    'RMP Pre-Clearances': 'Pre-Autorizări RMP',
    'Vehicle Entry': 'Intrare Vehicul',
    'Vehicle Exit': 'Ieșire Vehicul',
    'Visitor Entry': 'Intrare Vizitator',
    'Delivery Log': 'Registru Livrări',
    'Service Staff': 'Personal de Serviciu',
    'Global Search': 'Căutare Globală',
    'Gate Activity': 'Activitate Poartă',
    'Shift Handover': 'Predare Tură',
    'Accountability': 'Audit Responsabilitate',
    'Gate AI Assistant': 'Asistent AI Poartă',
    'OPEN BARRIER': 'DESCHIDE BARIERA',
    'CLOSE BARRIER': 'ÎNCHIDE BARIERA',
    'LOCKDOWN': 'BLOCARE DE URGENȚĂ',
    'BARRIER CLOSED': 'BARIERĂ ÎNCHISĂ',
    'BARRIER OPEN': 'BARIERĂ DESCHISĂ',
    'Emergency': 'Urgență',
    'Logout': 'Deconectare',
    'Refresh': 'Reîmprospătează',
    'Switch Gate': 'Schimbă Poarta',
    'Management Portal': 'Portal Administrație',
    'Inspect Guard Portal': 'Inspectează Consola Porții',
    'Overview': 'Prezentare Generală',
    'Gates & Barriers': 'Porți și Bariere',
    'Vehicles': 'Vehicule',
    'Visitors': 'Vizitatori',
    'Houses & Residents': 'Case și Locatari',
    'Resident Directory': 'Registrul Locatarilor',
    'Guards Roster': 'Registrul Agenților',
    'Deliveries': 'Livrări',
    'Incidents': 'Incidente',
    'Alerts': 'Alerte de Securitate',
    'Watchlist': 'Listă de Supraveghere',
    'CCTV Grid': 'Grilă Camere CCTV',
    'Parking': 'Parcare',
    'Search': 'Căutare',
    'Secure AI': 'AI Securitate',
    'Audit Logs': 'Jurnale de Audit',
    'Reports': 'Rapoarte',
    'Portfolio Overview': 'Prezentare Portofoliu',
    'Select Society:': 'Selectați Complexul:',
    'All Societies': 'Toate Complexurile',
    'Details': 'Detalii',
    'Check Every Detail of Active Society': 'Verificați toate detaliile complexului activ',
    'ONLINE': 'ONLINE',
    'OFFLINE': 'OFFLINE',
    'ON_DUTY': 'ÎN TURĂ',
    'INSIDE': 'ÎN INTERIOR',
    'OUTSIDE': 'ÎN EXTERIOR',
    'ACTIVE': 'ACTIV',
    'EXCELLENT': 'EXCELENT',
    'GOOD': 'BUN',
    'Cancel': 'Anulează',
    'Save': 'Salvează',
    'Close': 'Închide',
    'Done': 'Gata'
  }
};

// Comprehensive domain word dictionary across all 7 languages so any dynamic label, table header, or composite option is translated
const WORD_VOCABULARY: Record<Exclude<LanguageCode, 'en'>, Record<string, string>> = {
  ur: {
    society: 'سوسائٹی',
    societies: 'سوسائٹیز',
    architect: 'آرکیٹیکٹ',
    residency: 'ریزیڈنسی',
    estates: 'اسٹیٹس',
    management: 'مینجمنٹ',
    guard: 'گارڈ',
    guards: 'گارڈز',
    security: 'سیکیورٹی',
    owner: 'اونر',
    resident: 'رہائشی',
    residents: 'رہائشیوں',
    portal: 'پورٹل',
    dashboard: 'ڈیش بورڈ',
    console: 'کنسول',
    gate: 'گیٹ',
    gates: 'گیٹس',
    barrier: 'بیریئر',
    barriers: 'بیریئرز',
    house: 'گھر',
    houses: 'گھر',
    villa: 'ولا',
    block: 'بلاک',
    street: 'سٹریٹ',
    sector: 'سیکٹر',
    vehicle: 'گاڑی',
    vehicles: 'گاڑیاں',
    car: 'گاڑی',
    plate: 'نمبر پلیٹ',
    plates: 'نمبر پلیٹس',
    visitor: 'مہمان',
    visitors: 'مہمان',
    guest: 'مہمان',
    guests: 'مہمانوں',
    delivery: 'ڈیلیوری',
    deliveries: 'ڈیلیوریز',
    service: 'سروس',
    staff: 'اسٹاف',
    worker: 'ورکر',
    workers: 'ورکرز',
    incident: 'واقعہ',
    incidents: 'واقعات',
    alert: 'الرٹ',
    alerts: 'الرٹس',
    watchlist: 'واچ لسٹ',
    camera: 'کیمرہ',
    cameras: 'کیمرے',
    parking: 'پارکنگ',
    search: 'تلاش',
    verify: 'تصدیق کریں',
    verified: 'تصدیق شدہ',
    verification: 'تصدیق',
    code: 'کوڈ',
    passcode: 'پاس کوڈ',
    password: 'پاس ورڈ',
    access: 'رسائی',
    entry: 'داخلہ',
    exit: 'خروج',
    approved: 'منظور شدہ',
    denied: 'مسترد',
    pending: 'زیر التواء',
    active: 'فعال',
    inactive: 'غیر فعال',
    inside: 'اندر',
    outside: 'باہر',
    online: 'آن لائن',
    offline: 'آف لائن',
    open: 'کھولیں',
    close: 'بند کریں',
    closed: 'بند',
    lockdown: 'لاک ڈاؤن',
    emergency: 'ایمرجنسی',
    contact: 'رابطہ',
    phone: 'فون',
    name: 'نام',
    status: 'اسٹیٹس',
    shift: 'شفٹ',
    morning: 'صبح',
    evening: 'شام',
    night: 'رات',
    time: 'وقت',
    date: 'تاریخ',
    notes: 'نوٹس',
    action: 'عمل',
    actions: 'اقدامات',
    add: 'شامل کریں',
    edit: 'ترمیم',
    delete: 'حذف کریں',
    remove: 'ہٹائیں',
    register: 'رجسٹر کریں',
    submit: 'جمع کریں',
    confirm: 'تصدیق کریں',
    clear: 'صاف کریں',
    refresh: 'ریفریش',
    filter: 'فلٹر',
    export: 'ایکسپورٹ',
    total: 'کل',
    today: 'آج',
    live: 'لائیو',
    overview: 'جائزہ',
    directory: 'ڈائریکٹری',
    roster: 'روسٹر',
    audit: 'آڈٹ',
    logs: 'لاگز',
    reports: 'رپورٹس',
    score: 'اسکور',
    details: 'تفصیلات',
    official: 'آفیشل',
    select: 'منتخب کریں',
    all: 'تمام',
    new: 'نیا',
    pass: 'پاس',
    scan: 'اسکین',
    activity: 'سرگرمی',
    handover: 'ہینڈ اوور',
    accountability: 'احتساب',
    assistant: 'اسسٹنٹ',
    logout: 'لاگ آؤٹ',
    login: 'لاگ ان',
    cancel: 'منسوخ کریں',
    save: 'محفوظ کریں'
  },
  hi: {
    society: 'सोसायटी',
    societies: 'सोसायटियाँ',
    architect: 'आर्किटेक्ट',
    residency: 'रेजिडेंसी',
    estates: 'एस्टेट्स',
    management: 'प्रबंधन',
    guard: 'गार्ड',
    guards: 'गार्ड्स',
    security: 'सुरक्षा',
    owner: 'ओनर',
    resident: 'निवासी',
    residents: 'निवासी',
    portal: 'पोर्टल',
    dashboard: 'डैशबोर्ड',
    console: 'कंसोल',
    gate: 'गेट',
    gates: 'गेट्स',
    barrier: 'बैरियर',
    barriers: 'बैरियर्स',
    house: 'मकान',
    houses: 'मकान',
    villa: 'विला',
    block: 'ब्लॉक',
    street: 'गली',
    sector: 'सेक्टर',
    vehicle: 'वाहन',
    vehicles: 'वाहन',
    car: 'कार',
    plate: 'प्लेट',
    plates: 'प्लेट्स',
    visitor: 'आगंतुक',
    visitors: 'आगंतुक',
    guest: 'अतिथि',
    guests: 'अतिथि',
    delivery: 'डिलीवरी',
    deliveries: 'डिलीवरी',
    service: 'सेवा',
    staff: 'स्टाफ',
    worker: 'कर्मचारी',
    workers: 'कर्मचारी',
    incident: 'घटना',
    incidents: 'घटनाएँ',
    alert: 'अलर्ट',
    alerts: 'अलर्ट्स',
    watchlist: 'वॉचलिस्ट',
    camera: 'कैमरा',
    cameras: 'कैमरे',
    parking: 'पार्किंग',
    search: 'खोजें',
    verify: 'सत्यापित करें',
    verified: 'सत्यापित',
    verification: 'सत्यापन',
    code: 'कोड',
    passcode: 'पासकोड',
    password: 'पासवर्ड',
    access: 'प्रवेश',
    entry: 'प्रवेश',
    exit: 'निकास',
    approved: 'स्वीकृत',
    denied: 'अस्वीकृत',
    pending: 'लंबित',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    inside: 'अंदर',
    outside: 'बाहर',
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    open: 'खोलें',
    close: 'बंद करें',
    closed: 'बंद',
    lockdown: 'लॉकडाउन',
    emergency: 'आपातकालीन',
    contact: 'संपर्क',
    phone: 'फ़ोन',
    name: 'नाम',
    status: 'स्थिति',
    shift: 'शिफ्ट',
    morning: 'सुबह',
    evening: 'शाम',
    night: 'रात',
    time: 'समय',
    date: 'तारीख',
    notes: 'नोट्स',
    action: 'कार्रवाई',
    actions: 'कार्रवाइयाँ',
    add: 'जोड़ें',
    edit: 'संपादित करें',
    delete: 'हटाएँ',
    remove: 'हटाएँ',
    register: 'पंजीकृत करें',
    submit: 'जमा करें',
    confirm: 'पुष्टि करें',
    clear: 'साफ़ करें',
    refresh: 'रीफ्रेश',
    filter: 'फ़िल्टर',
    export: 'निर्यात',
    total: 'कुल',
    today: 'आज',
    live: 'लाइव',
    overview: 'अवलोकन',
    directory: 'निर्देशिका',
    roster: 'रोस्टर',
    audit: 'ऑडिट',
    logs: 'लॉग्स',
    reports: 'रिपोर्ट्स',
    score: 'स्कोर',
    details: 'विवरण',
    official: 'आधिकारिक',
    select: 'चुनें',
    all: 'सभी',
    new: 'नया',
    pass: 'पास',
    scan: 'स्कैन',
    activity: 'गतिविधि',
    handover: 'हैंडओवर',
    accountability: 'जवाबदेही',
    assistant: 'सहायक',
    logout: 'लॉग आउट',
    login: 'लॉग इन',
    cancel: 'रद्द करें',
    save: 'सहेजें'
  },
  fr: {
    society: 'Résidence',
    societies: 'Résidences',
    architect: 'Architectes',
    residency: 'Résidence',
    estates: 'Domaine',
    management: 'Administration',
    guard: 'Garde',
    guards: 'Gardes',
    security: 'Sécurité',
    owner: 'Propriétaire',
    resident: 'Résident',
    residents: 'Résidents',
    portal: 'Portail',
    dashboard: 'Tableau',
    console: 'Console',
    gate: 'Portail',
    gates: 'Portails',
    barrier: 'Barrière',
    barriers: 'Barrières',
    house: 'Maison',
    houses: 'Maisons',
    villa: 'Villa',
    block: 'Bloc',
    street: 'Rue',
    sector: 'Secteur',
    vehicle: 'Véhicule',
    vehicles: 'Véhicules',
    car: 'Voiture',
    plate: 'Plaque',
    plates: 'Plaques',
    visitor: 'Visiteur',
    visitors: 'Visiteurs',
    guest: 'Invité',
    guests: 'Invités',
    delivery: 'Livraison',
    deliveries: 'Livraisons',
    service: 'Service',
    staff: 'Personnel',
    worker: 'Technicien',
    workers: 'Techniciens',
    incident: 'Incident',
    incidents: 'Incidents',
    alert: 'Alerte',
    alerts: 'Alertes',
    watchlist: 'Surveillance',
    camera: 'Caméra',
    cameras: 'Caméras',
    parking: 'Parking',
    search: 'Recherche',
    verify: 'Vérifier',
    verified: 'Vérifié',
    verification: 'Vérification',
    code: 'Code',
    passcode: 'Code',
    password: 'Mot de passe',
    access: 'Accès',
    entry: 'Entrée',
    exit: 'Sortie',
    approved: 'Approuvé',
    denied: 'Refusé',
    pending: 'En attente',
    active: 'Actif',
    inactive: 'Inactif',
    inside: 'Intérieur',
    outside: 'Extérieur',
    online: 'En ligne',
    offline: 'Hors ligne',
    open: 'Ouvrir',
    close: 'Fermer',
    closed: 'Fermé',
    lockdown: 'Verrouillage',
    emergency: 'Urgence',
    contact: 'Contact',
    phone: 'Téléphone',
    name: 'Nom',
    status: 'Statut',
    shift: 'Service',
    morning: 'Matin',
    evening: 'Soir',
    night: 'Nuit',
    time: 'Heure',
    date: 'Date',
    notes: 'Notes',
    action: 'Action',
    actions: 'Actions',
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    remove: 'Retirer',
    register: 'Enregistrer',
    submit: 'Envoyer',
    confirm: 'Confirmer',
    clear: 'Effacer',
    refresh: 'Actualiser',
    filter: 'Filtrer',
    export: 'Exporter',
    total: 'Total',
    today: 'Aujourd’hui',
    live: 'En direct',
    overview: 'Aperçu',
    directory: 'Annuaire',
    roster: 'Effectif',
    audit: 'Audit',
    logs: 'Journaux',
    reports: 'Rapports',
    score: 'Score',
    details: 'Détails',
    official: 'Officiel',
    select: 'Sélectionner',
    all: 'Tous',
    new: 'Nouveau',
    pass: 'Laissez-passer',
    scan: 'Scanner',
    activity: 'Activité',
    handover: 'Relève',
    accountability: 'Traçabilité',
    assistant: 'Assistant',
    logout: 'Déconnexion',
    login: 'Connexion',
    cancel: 'Annuler',
    save: 'Enregistrer'
  },
  ru: {
    society: 'Комплекс',
    societies: 'Комплексы',
    architect: 'Архитекторов',
    residency: 'Резиденция',
    estates: 'Поместье',
    management: 'Управление',
    guard: 'Охрана',
    guards: 'Охранники',
    security: 'Безопасность',
    owner: 'Владелец',
    resident: 'Житель',
    residents: 'Жители',
    portal: 'Портал',
    dashboard: 'Панель',
    console: 'Пульт',
    gate: 'Ворота',
    gates: 'Ворота',
    barrier: 'Шлагбаум',
    barriers: 'Шлагбаумы',
    house: 'Дом',
    houses: 'Дома',
    villa: 'Вилла',
    block: 'Блок',
    street: 'Улица',
    sector: 'Сектор',
    vehicle: 'Транспорт',
    vehicles: 'Транспорт',
    car: 'Автомобиль',
    plate: 'Номер',
    plates: 'Номера',
    visitor: 'Посетитель',
    visitors: 'Посетители',
    guest: 'Гость',
    guests: 'Гости',
    delivery: 'Доставка',
    deliveries: 'Доставки',
    service: 'Сервис',
    staff: 'Персонал',
    worker: 'Работник',
    workers: 'Работники',
    incident: 'Инцидент',
    incidents: 'Инциденты',
    alert: 'Тревога',
    alerts: 'Оповещения',
    watchlist: 'Черный список',
    camera: 'Камера',
    cameras: 'Камеры',
    parking: 'Парковка',
    search: 'Поиск',
    verify: 'Проверить',
    verified: 'Проверено',
    verification: 'Проверка',
    code: 'Код',
    passcode: 'Код доступа',
    password: 'Пароль',
    access: 'Доступ',
    entry: 'Въезд',
    exit: 'Выезд',
    approved: 'Одобрено',
    denied: 'Отказано',
    pending: 'Ожидание',
    active: 'Активен',
    inactive: 'Неактивен',
    inside: 'Внутри',
    outside: 'Снаружи',
    online: 'Онлайн',
    offline: 'Офлайн',
    open: 'Открыть',
    close: 'Закрыть',
    closed: 'Закрыто',
    lockdown: 'Блокировка',
    emergency: 'Экстренно',
    contact: 'Контакт',
    phone: 'Телефон',
    name: 'Имя',
    status: 'Статус',
    shift: 'Смена',
    morning: 'Утро',
    evening: 'Вечер',
    night: 'Ночь',
    time: 'Время',
    date: 'Дата',
    notes: 'Заметки',
    action: 'Действие',
    actions: 'Действия',
    add: 'Добавить',
    edit: 'Изменить',
    delete: 'Удалить',
    remove: 'Убрать',
    register: 'Регистрация',
    submit: 'Отправить',
    confirm: 'Подтвердить',
    clear: 'Очистить',
    refresh: 'Обновить',
    filter: 'Фильтр',
    export: 'Экспорт',
    total: 'Всего',
    today: 'Сегодня',
    live: 'Эфир',
    overview: 'Обзор',
    directory: 'Реестр',
    roster: 'Штат',
    audit: 'Аудит',
    logs: 'Журнал',
    reports: 'Отчеты',
    score: 'Рейтинг',
    details: 'Детали',
    official: 'Официальный',
    select: 'Выбрать',
    all: 'Все',
    new: 'Новый',
    pass: 'Пропуск',
    scan: 'Сканировать',
    activity: 'Активность',
    handover: 'Передача',
    accountability: 'Отчетность',
    assistant: 'Помощник',
    logout: 'Выйти',
    login: 'Войти',
    cancel: 'Отмена',
    save: 'Сохранить'
  },
  de: {
    society: 'Wohnanlage',
    societies: 'Wohnanlagen',
    architect: 'Architekten',
    residency: 'Residenz',
    estates: 'Anwesen',
    management: 'Verwaltung',
    guard: 'Wache',
    guards: 'Wachen',
    security: 'Sicherheit',
    owner: 'Eigentümer',
    resident: 'Bewohner',
    residents: 'Bewohner',
    portal: 'Portal',
    dashboard: 'Dashboard',
    console: 'Konsole',
    gate: 'Tor',
    gates: 'Tore',
    barrier: 'Schranke',
    barriers: 'Schranken',
    house: 'Haus',
    houses: 'Häuser',
    villa: 'Villa',
    block: 'Block',
    street: 'Straße',
    sector: 'Sektor',
    vehicle: 'Fahrzeug',
    vehicles: 'Fahrzeuge',
    car: 'Auto',
    plate: 'Kennzeichen',
    plates: 'Kennzeichen',
    visitor: 'Besucher',
    visitors: 'Besucher',
    guest: 'Gast',
    guests: 'Gäste',
    delivery: 'Lieferung',
    deliveries: 'Lieferungen',
    service: 'Service',
    staff: 'Personal',
    worker: 'Handwerker',
    workers: 'Handwerker',
    incident: 'Vorfall',
    incidents: 'Vorfälle',
    alert: 'Warnung',
    alerts: 'Warnungen',
    watchlist: 'Sperrliste',
    camera: 'Kamera',
    cameras: 'Kameras',
    parking: 'Parkplatz',
    search: 'Suche',
    verify: 'Prüfen',
    verified: 'Verifiziert',
    verification: 'Prüfung',
    code: 'Code',
    passcode: 'Zugangscode',
    password: 'Passwort',
    access: 'Zugang',
    entry: 'Einfahrt',
    exit: 'Ausfahrt',
    approved: 'Genehmigt',
    denied: 'Abgelehnt',
    pending: 'Ausstehend',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    inside: 'Innerhalb',
    outside: 'Außerhalb',
    online: 'Online',
    offline: 'Offline',
    open: 'Öffnen',
    close: 'Schließen',
    closed: 'Geschlossen',
    lockdown: 'Sperrung',
    emergency: 'Notruf',
    contact: 'Kontakt',
    phone: 'Telefon',
    name: 'Name',
    status: 'Status',
    shift: 'Schicht',
    morning: 'Früh',
    evening: 'Spät',
    night: 'Nacht',
    time: 'Zeit',
    date: 'Datum',
    notes: 'Notizen',
    action: 'Aktion',
    actions: 'Aktionen',
    add: 'Hinzufügen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    remove: 'Entfernen',
    register: 'Registrieren',
    submit: 'Senden',
    confirm: 'Bestätigen',
    clear: 'Leeren',
    refresh: 'Aktualisieren',
    filter: 'Filter',
    export: 'Exportieren',
    total: 'Gesamt',
    today: 'Heute',
    live: 'Live',
    overview: 'Übersicht',
    directory: 'Verzeichnis',
    roster: 'Dienstplan',
    audit: 'Audit',
    logs: 'Protokolle',
    reports: 'Berichte',
    score: 'Bewertung',
    details: 'Details',
    official: 'Offiziell',
    select: 'Wählen',
    all: 'Alle',
    new: 'Neu',
    pass: 'Pass',
    scan: 'Scannen',
    activity: 'Aktivität',
    handover: 'Übergabe',
    accountability: 'Nachweis',
    assistant: 'Assistent',
    logout: 'Abmelden',
    login: 'Anmelden',
    cancel: 'Abbrechen',
    save: 'Speichern'
  },
  ro: {
    society: 'Complex',
    societies: 'Complexuri',
    architect: 'Arhitecților',
    residency: 'Rezidența',
    estates: 'Domeniul',
    management: 'Administrație',
    guard: 'Agent',
    guards: 'Agenți',
    security: 'Securitate',
    owner: 'Proprietar',
    resident: 'Locatar',
    residents: 'Locatari',
    portal: 'Portal',
    dashboard: 'Panou',
    console: 'Consolă',
    gate: 'Poartă',
    gates: 'Porți',
    barrier: 'Barieră',
    barriers: 'Bariere',
    house: 'Casă',
    houses: 'Case',
    villa: 'Vilă',
    block: 'Bloc',
    street: 'Stradă',
    sector: 'Sector',
    vehicle: 'Vehicul',
    vehicles: 'Vehicule',
    car: 'Mașină',
    plate: 'Număr',
    plates: 'Numere',
    visitor: 'Vizitator',
    visitors: 'Vizitatori',
    guest: 'Invitat',
    guests: 'Invitați',
    delivery: 'Livrare',
    deliveries: 'Livrări',
    service: 'Serviciu',
    staff: 'Personal',
    worker: 'Lucrător',
    workers: 'Lucrători',
    incident: 'Incident',
    incidents: 'Incidente',
    alert: 'Alertă',
    alerts: 'Alerte',
    watchlist: 'Supraveghere',
    camera: 'Cameră',
    cameras: 'Camere',
    parking: 'Parcare',
    search: 'Căutare',
    verify: 'Verifică',
    verified: 'Verificat',
    verification: 'Verificare',
    code: 'Cod',
    passcode: 'Cod de acces',
    password: 'Parolă',
    access: 'Acces',
    entry: 'Intrare',
    exit: 'Ieșire',
    approved: 'Aprobat',
    denied: 'Respins',
    pending: 'În așteptare',
    active: 'Activ',
    inactive: 'Inactiv',
    inside: 'Interior',
    outside: 'Exterior',
    online: 'Online',
    offline: 'Offline',
    open: 'Deschide',
    close: 'Închide',
    closed: 'Închis',
    lockdown: 'Blocare',
    emergency: 'Urgență',
    contact: 'Contact',
    phone: 'Telefon',
    name: 'Nume',
    status: 'Statut',
    shift: 'Tură',
    morning: 'Dimineața',
    evening: 'Seara',
    night: 'Noaptea',
    time: 'Oră',
    date: 'Dată',
    notes: 'Note',
    action: 'Acțiune',
    actions: 'Acțiuni',
    add: 'Adaugă',
    edit: 'Editează',
    delete: 'Șterge',
    remove: 'Elimină',
    register: 'Înregistrează',
    submit: 'Trimite',
    confirm: 'Confirmă',
    clear: 'Șterge',
    refresh: 'Reîmprospătează',
    filter: 'Filtru',
    export: 'Exportă',
    total: 'Total',
    today: 'Astăzi',
    live: 'Live',
    overview: 'Prezentare',
    directory: 'Registru',
    roster: 'Efectiv',
    audit: 'Audit',
    logs: 'Jurnale',
    reports: 'Rapoarte',
    score: 'Scor',
    details: 'Detalii',
    official: 'Oficial',
    select: 'Selectează',
    all: 'Toate',
    new: 'Nou',
    pass: 'Permis',
    scan: 'Scanează',
    activity: 'Activitate',
    handover: 'Predare',
    accountability: 'Responsabilitate',
    assistant: 'Asistent',
    logout: 'Deconectare',
    login: 'Autentificare',
    cancel: 'Anulează',
    save: 'Salvează'
  }
};

const SORTED_PHRASE_KEYS: Partial<Record<LanguageCode, string[]>> = {};

// Helper function to translate any string (Society name, Gate name, UI label, or composite phrase)
export function translateString(raw: string, lang: LanguageCode): string {
  if (!raw || lang === 'en') return raw;
  const map = PHRASE_TRANSLATIONS[lang];
  if (!map) return raw;

  const trimmed = raw.trim();
  if (!trimmed) return raw;

  // Skip pure numbers, phone numbers, email addresses, URLs, or hyphenated access/vehicle codes (e.g. GRD-AE-101, ABC-123)
  if (
    /^[0-9+\-()\s.:,/]+$/.test(trimmed) ||
    trimmed.includes('@') ||
    trimmed.startsWith('http') ||
    /^[A-Z0-9]{2,8}-[A-Z0-9-]+$/.test(trimmed)
  ) {
    return raw;
  }

  // 1. Direct exact match
  if (map[trimmed]) {
    return raw.replace(trimmed, map[trimmed]);
  }

  // 2. Replace known multi-word phrases & society names inside composite strings
  let result = raw;
  if (!SORTED_PHRASE_KEYS[lang]) {
    SORTED_PHRASE_KEYS[lang] = Object.keys(map).sort((a, b) => b.length - a.length);
  }
  const sortedKeys = SORTED_PHRASE_KEYS[lang]!;
  for (const key of sortedKeys) {
    if (key.length >= 4 && result.includes(key)) {
      result = result.split(key).join(map[key]);
    }
  }

  // 3. Translate remaining English UI words using WORD_VOCABULARY while preserving codes & numbers
  const wordMap = WORD_VOCABULARY[lang];
  if (wordMap) {
    result = result.replace(/\b([A-Za-z]{3,})\b/g, (match, word: string, offset: number, fullStr: string) => {
      // Do not translate if part of a hyphenated code like GRD-AE-101 or AEECHS-ADMIN-2026
      const prevChar = offset > 0 ? fullStr[offset - 1] : '';
      const nextChar = offset + match.length < fullStr.length ? fullStr[offset + match.length] : '';
      if (prevChar === '-' || nextChar === '-' || prevChar === '_' || nextChar === '_') {
        return match;
      }
      const lower = word.toLowerCase();
      const translated = wordMap[lower];
      if (!translated) return match;
      if (word === word.toUpperCase()) {
        return translated.toUpperCase();
      }
      return translated;
    });
  }

  return result;
}

export interface TranslationDictionary {
  // Header & Global
  appTitle: string;
  separateSocietyPage: string;
  securityMusic: string;
  musicActive: string;
  muted: string;
  systemOnline: string;
  weakNetwork: string;
  countryAndLanguage: string;
  selectCountry: string;
  selectLanguage: string;
  activeRegionBadge: string;
  emergencyDial: string;
  backToMainDashboard: string;

  // Hero Section
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroInstruction: string;

  // Country & Language Panel on Main Dashboard
  localizationTitle: string;
  localizationSubtitle: string;
  countryLabel: string;
  languageLabel: string;
  autoMatchLanguage: string;

  // Society Selection Card
  societySelectionTitle: string;
  requiredForManagement: string;
  societySelectionDesc: string;
  registerNewSociety: string;
  searchSocietyPlaceholder: string;
  confirmSociety: string;
  registeredSocieties: string;
  readyToConnect: string;
  activeBadge: string;
  selectAction: string;
  yourSocieties: string;
  verifiedSociety: string;
  gatesCountLabel: string;
  housesCountLabel: string;
  viewSocietyPageBtn: string;
  createNewBadge: string;
  provisionStarterDesc: string;

  // 4 Role Cards
  guardRoleTitle: string;
  guardRoleBadge: string;
  guardRoleDesc: string;
  guardRoleCta: string;

  mgmtRoleTitle: string;
  mgmtRoleBadge: string;
  mgmtRoleDesc: string;
  mgmtRoleCta: string;

  ownerRoleTitle: string;
  ownerRoleBadge: string;
  ownerRoleDesc: string;
  ownerRoleCta: string;

  rmpRoleTitle: string;
  rmpRoleBadge: string;
  rmpRoleDesc: string;
  rmpRoleCta: string;

  // Security Trust Indicators & Footer
  trustEncrypted: string;
  trustMultiTenant: string;
  trustLockout: string;
  footerText: string;

  // Register New Society Modal
  modalRegisterTitle: string;
  modalRegisterSubtitle: string;
  societyNameField: string;
  cityField: string;
  provinceField: string;
  addressField: string;
  autoProvisionTitle: string;
  autoProvision1: string;
  autoProvision2: string;
  autoProvision3: string;
  cancelBtn: string;
  registerAndConnectBtn: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appTitle: 'Secure 24 by 7',
    separateSocietyPage: 'Separate Society Page',
    securityMusic: 'Security Music',
    musicActive: 'MUSIC ACTIVE',
    muted: 'MUTED',
    systemOnline: 'SYSTEM ONLINE',
    weakNetwork: 'WEAK NETWORK',
    countryAndLanguage: 'Country & Language',
    selectCountry: 'Select Country',
    selectLanguage: 'Select Language (7 Languages)',
    activeRegionBadge: 'REGIONAL TERMINAL',
    emergencyDial: 'Emergency',
    backToMainDashboard: 'Main Dashboard',

    heroBadge: 'Commercial Access Control & Gate Intelligence',
    heroTitle: 'SECURE 24 BY 7',
    heroSubtitle: 'Smart Security • Intelligent Access • Complete Protection',
    heroInstruction: 'Select your country, preferred language, and society below to initialize access terminals',

    localizationTitle: 'International Country & Language Control',
    localizationSubtitle: 'Operate Secure 24 by 7 in 7 international languages with regional emergency & dialing presets',
    countryLabel: 'Country / Jurisdiction',
    languageLabel: 'Interface Language',
    autoMatchLanguage: 'Language Ready',

    societySelectionTitle: 'Society Selection & Registration',
    requiredForManagement: 'REQUIRED FOR MANAGEMENT',
    societySelectionDesc: 'Type your society name to search or add a new gated enclave. Connected live across guards, gates, and resident rosters.',
    registerNewSociety: 'Register New Society',
    searchSocietyPlaceholder: 'Type society name (e.g. AECS / AEECHS, Grand Horizon, Green Valley...)',
    confirmSociety: 'Confirm Society',
    registeredSocieties: 'Registered Societies',
    readyToConnect: 'Ready to Connect',
    activeBadge: 'ACTIVE',
    selectAction: 'Select →',
    yourSocieties: 'Your Societies:',
    verifiedSociety: 'VERIFIED SOCIETY:',
    gatesCountLabel: 'Gates',
    housesCountLabel: 'Houses',
    viewSocietyPageBtn: 'View Society Page',
    createNewBadge: 'CREATE NEW',
    provisionStarterDesc: 'Click to provision starter gates, resident directory & barrier controls',

    guardRoleTitle: 'Security Guard',
    guardRoleBadge: 'GATE CONSOLE',
    guardRoleDesc: 'Fast gate operations, ANPR vehicle scan, visitor check-in, electronic barrier controls & resident confirmation.',
    guardRoleCta: 'Verify ID & Enter',

    mgmtRoleTitle: 'Management',
    mgmtRoleBadge: 'ADMIN',
    mgmtRoleDesc: 'Command center, guard rosters, resident directory, incident reviews, CCTV grid, reports & Secure AI engine.',
    mgmtRoleCta: 'Enter Admin',

    ownerRoleTitle: 'Owner Suite',
    ownerRoleBadge: 'MASTER SUITE',
    ownerRoleDesc: 'Multi-society governance, security scores, executive audit logs, system health & hardware integrations.',
    ownerRoleCta: 'Master Login',

    rmpRoleTitle: 'RMP Portal',
    rmpRoleBadge: 'RESIDENT',
    rmpRoleDesc: 'Resident pre-notifications for guests, food deliveries & service staff with car number plate auto-catch.',
    rmpRoleCta: 'Enter Resident RMP',

    trustEncrypted: 'End-to-End Encrypted Access',
    trustMultiTenant: 'Multi-Tenant Society Isolation',
    trustLockout: '3-Attempt Intrusion Lockout Protection',
    footerText: 'SECURE 24 BY 7 • COMMERCIAL RESIDENTIAL GATE MANAGEMENT SYSTEM • PROTOCOL V4.2',

    modalRegisterTitle: 'Register New Society',
    modalRegisterSubtitle: 'Provision gates, resident directories, and barrier controls for your society',
    societyNameField: 'Society / Enclave Name *',
    cityField: 'City *',
    provinceField: 'Province / State',
    addressField: 'Complete Address / Main Boulevard',
    autoProvisionTitle: 'AUTOMATIC PROVISIONING:',
    autoProvision1: '• 2 Smart Barriers with ANPR cameras (North Main Gate & Secondary Gate)',
    autoProvision2: '• Resident House directory initialized with vehicle plate verification',
    autoProvision3: '• Instant link to Security Guard console, Owner audit suite & AI engine',
    cancelBtn: 'Cancel',
    registerAndConnectBtn: 'Register & Connect Society'
  },

  ur: {
    appTitle: 'سیکیور 24 بائی 7',
    separateSocietyPage: 'سوسائٹی کا الگ صفحہ',
    securityMusic: 'سیکیورٹی میوزک',
    musicActive: 'میوزک فعال ہے',
    muted: 'خاموش',
    systemOnline: 'سسٹم آن لائن',
    weakNetwork: 'کمزور نیٹ ورک',
    countryAndLanguage: 'ملک اور زبان',
    selectCountry: 'ملک منتخب کریں',
    selectLanguage: 'زبان منتخب کریں (7 زبانیں)',
    activeRegionBadge: 'علاقائی ٹرمینل',
    emergencyDial: 'ایمرجنسی',
    backToMainDashboard: 'مین ڈیش بورڈ',

    heroBadge: 'کمرشل ایکسیس کنٹرول اور گیٹ انٹیلی جنس سسٹم',
    heroTitle: 'سیکیور 24 بائی 7',
    heroSubtitle: 'سمارٹ سیکیورٹی • ذہین رسائی • مکمل تحفظ',
    heroInstruction: 'ٹرمینل شروع کرنے کے لیے نیچے اپنا ملک، پسندیدہ زبان اور سوسائٹی منتخب کریں',

    localizationTitle: 'بین الاقوامی ملک اور زبان کا انتخاب',
    localizationSubtitle: 'سیکیور 24 بائی 7 کو 7 بین الاقوامی زبانوں اور مقامی ایمرجنسی نمبرز کے ساتھ استعمال کریں',
    countryLabel: 'ملک / خطہ',
    languageLabel: 'ایپ کی زبان',
    autoMatchLanguage: 'زبان فعال ہے',

    societySelectionTitle: 'سوسائٹی کا انتخاب اور رجسٹریشن',
    requiredForManagement: 'مینجمنٹ کے لیے لازمی',
    societySelectionDesc: 'اپنی سوسائٹی تلاش کرنے یا نئی سوسائٹی شامل کرنے کے لیے نام لکھیں۔ گارڈز، گیٹس اور رہائشیوں کے ساتھ لائیو منسلک۔',
    registerNewSociety: 'نئی سوسائٹی رجسٹر کریں',
    searchSocietyPlaceholder: 'سوسائٹی کا نام لکھیں (مثلاً آرکیٹیکٹ سوسائٹی AEECHS، گرینڈ ہورائزن، گرین ویلی...)',
    confirmSociety: 'سوسائٹی کی تصدیق کریں',
    registeredSocieties: 'رجسٹرڈ سوسائٹیز',
    readyToConnect: 'منسلک ہونے کے لیے تیار',
    activeBadge: 'فعال',
    selectAction: 'منتخب کریں ←',
    yourSocieties: 'آپ کی سوسائٹیز:',
    verifiedSociety: 'تصدیق شدہ سوسائٹی:',
    gatesCountLabel: 'گیٹس',
    housesCountLabel: 'گھر',
    viewSocietyPageBtn: 'سوسائٹی صفحہ دیکھیں',
    createNewBadge: 'نئی بنائیں',
    provisionStarterDesc: 'نئے گیٹس، رہائشی ڈائریکٹری اور بیریئر کنٹرول بنانے کے لیے کلک کریں',

    guardRoleTitle: 'سیکیورٹی گارڈ',
    guardRoleBadge: 'گیٹ کنسول',
    guardRoleDesc: 'تیز گیٹ آپریشنز، گاڑی کی نمبر پلیٹ اسکین، مہمانوں کا اندراج، الیکٹرانک بیریئر کنٹرول اور رہائشی تصدیق۔',
    guardRoleCta: 'شناخت کی تصدیق اور داخلہ',

    mgmtRoleTitle: 'سوسائٹی مینجمنٹ',
    mgmtRoleBadge: 'ایڈمن',
    mgmtRoleDesc: 'کمانڈ سینٹر، گارڈز کا ریکارڈ، رہائشی ڈائریکٹری، واقعات کا جائزہ، سی سی ٹی وی اور سیکیور اے آئی انجن۔',
    mgmtRoleCta: 'ایڈمن پورٹل کھولیں',

    ownerRoleTitle: 'اونر سوئٹ',
    ownerRoleBadge: 'ماسٹر سوئٹ',
    ownerRoleDesc: 'ملٹی سوسائٹی نگرانی، سیکیورٹی اسکورز، ایگزیکٹو آڈٹ لاگز، سسٹم ہیلتھ اور ہارڈویئر کنٹرول۔',
    ownerRoleCta: 'ماسٹر لاگ ان',

    rmpRoleTitle: 'آر ایم پی پورٹل (RMP)',
    rmpRoleBadge: 'رہائشی',
    rmpRoleDesc: 'مہمانوں، فوڈ ڈیلیوری اور سروس اسٹاف کے لیے رہائشیوں کی پیشگی اطلاع اور گاڑی کی نمبر پلیٹ کی خودکار شناخت۔',
    rmpRoleCta: 'رہائشی پورٹل میں داخل ہوں',

    trustEncrypted: 'اینڈ ٹو اینڈ انکرپٹڈ رسائی',
    trustMultiTenant: 'ملٹی سوسائٹی ڈیٹا تحفظ',
    trustLockout: '3 غلط کوششوں پر خودکار لاک آؤٹ تحفظ',
    footerText: 'سیکیور 24 بائی 7 • کمرشل ریزیڈنشل گیٹ مینجمنٹ سسٹم • پروٹوکول V4.2',

    modalRegisterTitle: 'نئی سوسائٹی رجسٹر کریں',
    modalRegisterSubtitle: 'اپنی سوسائٹی کے لیے گیٹس، رہائشی ڈائریکٹری اور بیریئر کنٹرولز فعال کریں',
    societyNameField: 'سوسائٹی کا نام *',
    cityField: 'شہر *',
    provinceField: 'صوبہ / ریاست',
    addressField: 'مکمل پتہ / مین بلیوارڈ',
    autoProvisionTitle: 'خودکار سہولیات:',
    autoProvision1: '• اے این پی آر کیمروں کے ساتھ 2 اسمارٹ بیریئرز (مین گیٹ اور سیکنڈری گیٹ)',
    autoProvision2: '• گاڑیوں کی نمبر پلیٹ تصدیق کے ساتھ رہائشی ڈائریکٹری',
    autoProvision3: '• سیکیورٹی گارڈ کنسول، اونر آڈٹ سوئٹ اور اے آئی انجن کے ساتھ فوری ربط',
    cancelBtn: 'منسوخ کریں',
    registerAndConnectBtn: 'رجسٹر اور منسلک کریں'
  },

  hi: {
    appTitle: 'सिक्योर 24 बाय 7',
    separateSocietyPage: 'अलग सोसायटी पेज',
    securityMusic: 'सिक्योरिटी म्यूजिक',
    musicActive: 'संगीत चालू है',
    muted: 'म्यूट',
    systemOnline: 'सिस्टम ऑनलाइन',
    weakNetwork: 'कमजोर नेटवर्क',
    countryAndLanguage: 'देश और भाषा',
    selectCountry: 'देश चुनें',
    selectLanguage: 'भाषा चुनें (7 भाषाएँ)',
    activeRegionBadge: 'क्षेत्रीय टर्मिनल',
    emergencyDial: 'आपातकालीन',
    backToMainDashboard: 'मुख्य डैशबोर्ड',

    heroBadge: 'वाणिज्यिक एक्सेस कंट्रोल और गेट इंटेलिजेंस',
    heroTitle: 'सिक्योर 24 बाय 7',
    heroSubtitle: 'स्मार्ट सुरक्षा • बुद्धिमान प्रवेश • संपूर्ण संरक्षण',
    heroInstruction: 'एक्सेस टर्मिनल शुरू करने के लिए नीचे अपना देश, भाषा और सोसायटी चुनें',

    localizationTitle: 'अंतर्राष्ट्रीय देश और भाषा नियंत्रण',
    localizationSubtitle: 'क्षेत्रीय आपातकालीन नंबरों के साथ 7 अंतर्राष्ट्रीय भाषाओं में सिक्योर 24 बाय 7 का उपयोग करें',
    countryLabel: 'देश / क्षेत्राधिकार',
    languageLabel: 'इंटरफ़ेस भाषा',
    autoMatchLanguage: 'भाषा सक्रिय',

    societySelectionTitle: 'सोसायटी चयन और पंजीकरण',
    requiredForManagement: 'प्रबंधन के लिए आवश्यक',
    societySelectionDesc: 'खोजने या नई गेटेड सोसायटी जोड़ने के लिए अपनी सोसायटी का नाम टाइप करें। गार्ड, गेट और निवासियों के साथ लाइव जुड़ाव।',
    registerNewSociety: 'नई सोसायटी पंजीकृत करें',
    searchSocietyPlaceholder: 'सोसायटी का नाम टाइप करें (जैसे AEECHS, ग्रैंड होराइजन, ग्रीन वैली...)',
    confirmSociety: 'सोसायटी की पुष्टि करें',
    registeredSocieties: 'पंजीकृत सोसायटियाँ',
    readyToConnect: 'जुड़ने के लिए तैयार',
    activeBadge: 'सक्रिय',
    selectAction: 'चुनें →',
    yourSocieties: 'आपकी सोसायटियाँ:',
    verifiedSociety: 'सत्यापित सोसायटी:',
    gatesCountLabel: 'गेट्स',
    housesCountLabel: 'मकान',
    viewSocietyPageBtn: 'सोसायटी पेज देखें',
    createNewBadge: 'नया बनाएँ',
    provisionStarterDesc: 'गेट, निवासी निर्देशिका और बैरियर नियंत्रण सेटअप करने के लिए क्लिक करें',

    guardRoleTitle: 'सुरक्षा गार्ड',
    guardRoleBadge: 'गेट कंसोल',
    guardRoleDesc: 'तेज़ गेट संचालन, ANPR वाहन स्कैन, आगंतुक चेक-इन, इलेक्ट्रॉनिक बैरियर नियंत्रण और निवासी पुष्टि।',
    guardRoleCta: 'आईडी सत्यापित करें और प्रवेश करें',

    mgmtRoleTitle: 'सोसायटी प्रबंधन',
    mgmtRoleBadge: 'एडमिन',
    mgmtRoleDesc: 'कमांड सेंटर, गार्ड रोस्टर, निवासी निर्देशिका, घटना समीक्षा, सीसीटीवी ग्रिड, रिपोर्ट और सिक्योर एआई इंजन।',
    mgmtRoleCta: 'एडमिन में प्रवेश करें',

    ownerRoleTitle: 'ओनर सुइट',
    ownerRoleBadge: 'मास्टर सुइट',
    ownerRoleDesc: 'मल्टी-सोसायटी प्रशासन, सुरक्षा स्कोर, कार्यकारी ऑडिट लॉग, सिस्टम स्वास्थ्य और हार्डवेयर एकीकरण।',
    ownerRoleCta: 'मास्टर लॉगिन',

    rmpRoleTitle: 'RMP पोर्टल',
    rmpRoleBadge: 'निवासी',
    rmpRoleDesc: 'मेहमानों, फूड डिलीवरी और सर्विस स्टाफ के लिए निवासी पूर्व-सूचना और वाहन नंबर प्लेट ऑटो-कैच।',
    rmpRoleCta: 'निवासी RMP में प्रवेश करें',

    trustEncrypted: 'एंड-टू-एंड एन्क्रिप्टेड एक्सेस',
    trustMultiTenant: 'मल्टी-टेनेंट सोसायटी आइसोलेशन',
    trustLockout: '3-प्रयास घुसपैठ लॉकआउट सुरक्षा',
    footerText: 'सिक्योर 24 बाय 7 • आवासीय गेट प्रबंधन प्रणाली • प्रोटोकॉल V4.2',

    modalRegisterTitle: 'नई सोसायटी पंजीकृत करें',
    modalRegisterSubtitle: 'अपनी सोसायटी के लिए गेट, निवासी निर्देशिका और बैरियर नियंत्रण प्रावधान करें',
    societyNameField: 'सोसायटी / एन्क्लेव का नाम *',
    cityField: 'शहर *',
    provinceField: 'राज्य / प्रांत',
    addressField: 'पूरा पता / मुख्य मार्ग',
    autoProvisionTitle: 'स्वचालित प्रावधान:',
    autoProvision1: '• ANPR कैमरों के साथ 2 स्मार्ट बैरियर (मुख्य गेट और द्वितीयक गेट)',
    autoProvision2: '• वाहन प्लेट सत्यापन के साथ निवासी गृह निर्देशिका',
    autoProvision3: '• सुरक्षा गार्ड कंसोल, ओनर ऑडिट सुइट और एआई इंजन से तत्काल लिंक',
    cancelBtn: 'रद्द करें',
    registerAndConnectBtn: 'पंजीकृत करें और जोड़ें'
  },

  fr: {
    appTitle: 'Secure 24 sur 7',
    separateSocietyPage: 'Page Dédiée de la Résidence',
    securityMusic: 'Musique de Sécurité',
    musicActive: 'AUDIO ACTIF',
    muted: 'MUET',
    systemOnline: 'SYSTÈME EN LIGNE',
    weakNetwork: 'RÉSEAU FAIBLE',
    countryAndLanguage: 'Pays et Langue',
    selectCountry: 'Choisir le Pays',
    selectLanguage: 'Choisir la Langue (7 Langues)',
    activeRegionBadge: 'TERMINAL RÉGIONAL',
    emergencyDial: 'Urgence',
    backToMainDashboard: 'Tableau Principal',

    heroBadge: 'Contrôle d’Accès Commercial et Intelligence de Portail',
    heroTitle: 'SECURE 24 SUR 7',
    heroSubtitle: 'Sécurité Intelligente • Accès Contrôlé • Protection Complète',
    heroInstruction: 'Sélectionnez votre pays, votre langue et votre résidence ci-dessous pour initialiser les terminaux',

    localizationTitle: 'Contrôle International du Pays et de la Langue',
    localizationSubtitle: 'Utilisez Secure 24 by 7 en 7 langues internationales avec numéros d’urgence régionaux',
    countryLabel: 'Pays / Juridiction',
    languageLabel: 'Langue de l’Interface',
    autoMatchLanguage: 'Langue Active',

    societySelectionTitle: 'Sélection et Enregistrement de la Résidence',
    requiredForManagement: 'REQUIS POUR LA GESTION',
    societySelectionDesc: 'Tapez le nom de votre résidence pour rechercher ou ajouter un domaine sécurisé. Connecté en direct aux gardes et résidents.',
    registerNewSociety: 'Enregistrer une Résidence',
    searchSocietyPlaceholder: 'Tapez le nom de la résidence (ex: AEECHS, Grand Horizon, Green Valley...)',
    confirmSociety: 'Confirmer la Résidence',
    registeredSocieties: 'Résidences Enregistrées',
    readyToConnect: 'Prêt à Connecter',
    activeBadge: 'ACTIF',
    selectAction: 'Sélectionner →',
    yourSocieties: 'Vos Résidences :',
    verifiedSociety: 'RÉSIDENCE VÉRIFIÉE :',
    gatesCountLabel: 'Portails',
    housesCountLabel: 'Maisons',
    viewSocietyPageBtn: 'Voir la Page Résidence',
    createNewBadge: 'CRÉER NOUVEAU',
    provisionStarterDesc: 'Cliquez pour configurer les portails, le répertoire des résidents et les barrières',

    guardRoleTitle: 'Garde de Sécurité',
    guardRoleBadge: 'CONSOLE PORTAIL',
    guardRoleDesc: 'Opérations rapides aux portails, scan ANPR des plaques, enregistrement visiteurs, contrôle des barrières et confirmation.',
    guardRoleCta: 'Vérifier ID et Entrer',

    mgmtRoleTitle: 'Administration',
    mgmtRoleBadge: 'ADMIN',
    mgmtRoleDesc: 'Centre de commande, plannings des gardes, annuaire des résidents, incidents, vidéosurveillance CCTV et moteur IA.',
    mgmtRoleCta: 'Accès Admin',

    ownerRoleTitle: 'Suite Propriétaire',
    ownerRoleBadge: 'SUITE MASTER',
    ownerRoleDesc: 'Gouvernance multi-résidences, scores de sécurité, journaux d’audit exécutifs, état du système et matériel.',
    ownerRoleCta: 'Connexion Master',

    rmpRoleTitle: 'Portail RMP',
    rmpRoleBadge: 'RÉSIDENT',
    rmpRoleDesc: 'Pré-notifications des résidents pour invités, livraisons et personnel avec détection automatique des plaques.',
    rmpRoleCta: 'Ouvrir Portail RMP',

    trustEncrypted: 'Accès Chiffré de Bout en Bout',
    trustMultiTenant: 'Isolation Multi-Résidences',
    trustLockout: 'Verrouillage Après 3 Tentatives Échouées',
    footerText: 'SECURE 24 SUR 7 • SYSTÈME DE GESTION DE PORTAILS RÉSIDENTIELS • PROTOCOLE V4.2',

    modalRegisterTitle: 'Enregistrer une Nouvelle Résidence',
    modalRegisterSubtitle: 'Configurez les portails, l’annuaire des résidents et les barrières automatiques',
    societyNameField: 'Nom de la Résidence / Domaine *',
    cityField: 'Ville *',
    provinceField: 'Province / Région',
    addressField: 'Adresse Complète / Boulevard Principal',
    autoProvisionTitle: 'CONFIGURATION AUTOMATIQUE :',
    autoProvision1: '• 2 Barrières intelligentes avec caméras ANPR (Portail Nord et Secondaire)',
    autoProvision2: '• Annuaire des résidents initialisé avec vérification des plaques',
    autoProvision3: '• Liaison directe avec la console Garde, la suite Propriétaire et l’IA',
    cancelBtn: 'Annuler',
    registerAndConnectBtn: 'Enregistrer et Connecter'
  },

  ru: {
    appTitle: 'Secure 24 на 7',
    separateSocietyPage: 'Отдельная страница комплекса',
    securityMusic: 'Фоновый звук',
    musicActive: 'ЗВУК ВКЛЮЧЕН',
    muted: 'БЕЗ ЗВУКА',
    systemOnline: 'СИСТЕМА ОНЛАЙН',
    weakNetwork: 'СЛАБАЯ СЕТЬ',
    countryAndLanguage: 'Страна и язык',
    selectCountry: 'Выберите страну',
    selectLanguage: 'Выберите язык (7 языков)',
    activeRegionBadge: 'РЕГИОНАЛЬНЫЙ ТЕРМИНАЛ',
    emergencyDial: 'Экстренная связь',
    backToMainDashboard: 'Главная панель',

    heroBadge: 'Коммерческий контроль доступа и интеллектуальные ворота',
    heroTitle: 'SECURE 24 НА 7',
    heroSubtitle: 'Умная безопасность • Интеллектуальный доступ • Полная защита',
    heroInstruction: 'Выберите страну, язык и жилой комплекс ниже для запуска терминалов доступа',

    localizationTitle: 'Международный выбор страны и языка',
    localizationSubtitle: 'Используйте Secure 24 by 7 на 7 мировых языках с региональными экстренными службами',
    countryLabel: 'Страна / Юрисдикция',
    languageLabel: 'Язык интерфейса',
    autoMatchLanguage: 'Язык активен',

    societySelectionTitle: 'Выбор и регистрация жилого комплекса',
    requiredForManagement: 'ТРЕБУЕТСЯ ДЛЯ УПРАВЛЕНИЯ',
    societySelectionDesc: 'Введите название комплекса для поиска или добавления новой закрытой территории. Прямая связь с охраной и жителями.',
    registerNewSociety: 'Добавить комплекс',
    searchSocietyPlaceholder: 'Введите название комплекса (например: AEECHS, Grand Horizon, Green Valley...)',
    confirmSociety: 'Подтвердить комплекс',
    registeredSocieties: 'Зарегистрированные комплексы',
    readyToConnect: 'Готов к подключению',
    activeBadge: 'АКТИВЕН',
    selectAction: 'Выбрать →',
    yourSocieties: 'Ваши комплексы:',
    verifiedSociety: 'ПОДТВЕРЖДЕННЫЙ КОМПЛЕКС:',
    gatesCountLabel: 'Ворот',
    housesCountLabel: 'Домов',
    viewSocietyPageBtn: 'Страница комплекса',
    createNewBadge: 'СОЗДАТЬ НОВЫЙ',
    provisionStarterDesc: 'Нажмите для настройки ворот, реестра жителей и шлагбаумов',

    guardRoleTitle: 'Служба охраны',
    guardRoleBadge: 'ПУЛЬТ КПП',
    guardRoleDesc: 'Быстрое управление КПП, ANPR-сканирование номеров, регистрация гостей, шлагбаумы и связь с жителями.',
    guardRoleCta: 'Проверить ID и войти',

    mgmtRoleTitle: 'Управление (Админ)',
    mgmtRoleBadge: 'АДМИН',
    mgmtRoleDesc: 'Центр управления, смены охраны, реестр жителей, разбор инцидентов, камеры CCTV, отчеты и ИИ-модуль.',
    mgmtRoleCta: 'Войти в Админ-панель',

    ownerRoleTitle: 'Кабинет владельца',
    ownerRoleBadge: 'МАСТЕР-ДОСТУП',
    ownerRoleDesc: 'Управление всеми объектами, рейтинги безопасности, журнал аудита, состояние системы и оборудования.',
    ownerRoleCta: 'Мастер-вход',

    rmpRoleTitle: 'Портал жителей (RMP)',
    rmpRoleBadge: 'ЖИТЕЛЬ',
    rmpRoleDesc: 'Предварительные заявки жителей на гостей, доставку и сервисные службы с авто-распознаванием номеров.',
    rmpRoleCta: 'Открыть портал RMP',

    trustEncrypted: 'Сквозное шифрование доступа',
    trustMultiTenant: 'Изоляция данных комплексов',
    trustLockout: 'Блокировка после 3 неудачных попыток входа',
    footerText: 'SECURE 24 НА 7 • СИСТЕМА УПРАВЛЕНИЯ КПП ЖИЛЫХ КОМПЛЕКСОВ • ПРОТОКОЛ V4.2',

    modalRegisterTitle: 'Регистрация нового комплекса',
    modalRegisterSubtitle: 'Настройте КПП, базу жителей и управление шлагбаумами для вашего комплекса',
    societyNameField: 'Название жилого комплекса *',
    cityField: 'Город *',
    provinceField: 'Область / Регион',
    addressField: 'Полный адрес / Главный проспект',
    autoProvisionTitle: 'АВТОМАТИЧЕСКАЯ НАСТРОЙКА:',
    autoProvision1: '• 2 умных шлагбаума с камерами ANPR (Главные и Вторые ворота)',
    autoProvision2: '• База домов и жителей с проверкой государственных номеров',
    autoProvision3: '• Мгновенная синхронизация с пультом охраны, кабинетом владельца и ИИ',
    cancelBtn: 'Отмена',
    registerAndConnectBtn: 'Зарегистрировать и подключить'
  },

  de: {
    appTitle: 'Secure 24 mal 7',
    separateSocietyPage: 'Separate Wohnanlagen-Seite',
    securityMusic: 'Sicherheits-Audio',
    musicActive: 'AUDIO AKTIV',
    muted: 'STUMM',
    systemOnline: 'SYSTEM ONLINE',
    weakNetwork: 'SCHWACHES NETZ',
    countryAndLanguage: 'Land & Sprache',
    selectCountry: 'Land auswählen',
    selectLanguage: 'Sprache wählen (7 Sprachen)',
    activeRegionBadge: 'REGIONALES TERMINAL',
    emergencyDial: 'Notruf',
    backToMainDashboard: 'Haupt-Dashboard',

    heroBadge: 'Kommerzielle Zutrittskontrolle & Tor-Intelligenz',
    heroTitle: 'SECURE 24 MAL 7',
    heroSubtitle: 'Intelligente Sicherheit • Smarte Zufahrt • Vollständiger Schutz',
    heroInstruction: 'Wählen Sie unten Ihr Land, Ihre bevorzugte Sprache und Ihre Wohnanlage aus, um die Terminals zu starten',

    localizationTitle: 'Internationale Länder- & Sprachsteuerung',
    localizationSubtitle: 'Nutzen Sie Secure 24 by 7 in 7 internationalen Sprachen inklusive regionaler Notruf-Voreinstellungen',
    countryLabel: 'Land / Zuständigkeit',
    languageLabel: 'Oberflächensprache (Germanish / Deutsch)',
    autoMatchLanguage: 'Sprache Aktiv',

    societySelectionTitle: 'Wohnanlagen-Auswahl & Registrierung',
    requiredForManagement: 'ERFORDERLICH FÜR VERWALTUNG',
    societySelectionDesc: 'Geben Sie den Namen Ihrer Wohnanlage ein, um zu suchen oder eine neue Anlage hinzuzufügen. Live verbunden mit Wachen & Toren.',
    registerNewSociety: 'Neue Anlage Registrieren',
    searchSocietyPlaceholder: 'Name der Wohnanlage eingeben (z. B. AEECHS, Grand Horizon, Green Valley...)',
    confirmSociety: 'Anlage Bestätigen',
    registeredSocieties: 'Registrierte Wohnanlagen',
    readyToConnect: 'Verbindungsbereit',
    activeBadge: 'AKTIV',
    selectAction: 'Auswählen →',
    yourSocieties: 'Ihre Wohnanlagen:',
    verifiedSociety: 'VERIFIZIERTE ANLAGE:',
    gatesCountLabel: 'Tore',
    housesCountLabel: 'Häuser',
    viewSocietyPageBtn: 'Anlagen-Seite öffnen',
    createNewBadge: 'NEU ERSTELLEN',
    provisionStarterDesc: 'Klicken, um Starter-Tore, Bewohnerverzeichnis & Schrankensteuerung einzurichten',

    guardRoleTitle: 'Sicherheitsdienst',
    guardRoleBadge: 'TOR-KONSOLE',
    guardRoleDesc: 'Schnelle Torabfertigung, ANPR-Kennzeichenscan, Besucher-Check-in, elektronische Schranken & Bewohnerbestätigung.',
    guardRoleCta: 'ID prüfen & Eintreten',

    mgmtRoleTitle: 'Verwaltung (Admin)',
    mgmtRoleBadge: 'ADMIN',
    mgmtRoleDesc: 'Leitstelle, Wachdienstpläne, Bewohnerverzeichnis, Vorfallprüfung, CCTV-Kameras, Berichte & Secure KI-Engine.',
    mgmtRoleCta: 'Admin öffnen',

    ownerRoleTitle: 'Eigentümer-Suite',
    ownerRoleBadge: 'MASTER-SUITE',
    ownerRoleDesc: 'Multi-Anlagen-Steuerung, Sicherheitsbewertungen, Executive-Audit-Protokolle, Systemstatus & Hardware.',
    ownerRoleCta: 'Master-Login',

    rmpRoleTitle: 'RMP-Portal',
    rmpRoleBadge: 'BEWOHNER',
    rmpRoleDesc: 'Bewohner-Voranmeldungen für Gäste, Lieferungen & Dienstleister mit automatischer Kennzeichenerkennung.',
    rmpRoleCta: 'Bewohner-RMP öffnen',

    trustEncrypted: 'Ende-zu-Ende-verschlüsselter Zugriff',
    trustMultiTenant: 'Mandantenfähige Anlagen-Isolierung',
    trustLockout: 'Sperrschutz nach 3 Fehlversuchen',
    footerText: 'SECURE 24 MAL 7 • KOMMERZIELLES TOR- & WOHNANLAGEN-MANAGEMENTSYSTEM • PROTOKOLL V4.2',

    modalRegisterTitle: 'Neue Wohnanlage Registrieren',
    modalRegisterSubtitle: 'Richten Sie Tore, Bewohnerverzeichnisse und Schrankensteuerungen für Ihre Anlage ein',
    societyNameField: 'Name der Wohnanlage / Enklave *',
    cityField: 'Stadt *',
    provinceField: 'Bundesland / Provinz',
    addressField: 'Vollständige Adresse / Hauptstraße',
    autoProvisionTitle: 'AUTOMATISCHE BEREITSTELLUNG:',
    autoProvision1: '• 2 Intelligente Schranken mit ANPR-Kameras (Nord-Haupttor & Nebentor)',
    autoProvision2: '• Bewohner-Hausverzeichnis initialisiert mit Kennzeichenprüfung',
    autoProvision3: '• Sofortige Verbindung zu Wachkonsole, Eigentümer-Audit & KI-Engine',
    cancelBtn: 'Abbrechen',
    registerAndConnectBtn: 'Registrieren & Verbinden'
  },

  ro: {
    appTitle: 'Secure 24 din 7',
    separateSocietyPage: 'Pagină Dedicată Complexului',
    securityMusic: 'Sunet Securitate',
    musicActive: 'AUDIO ACTIV',
    muted: 'OPRIT',
    systemOnline: 'SISTEM ONLINE',
    weakNetwork: 'REȚEA SLABĂ',
    countryAndLanguage: 'Țară și Limbă',
    selectCountry: 'Selectați Țara',
    selectLanguage: 'Selectați Limba (7 Limbi)',
    activeRegionBadge: 'TERMINAL REGIONAL',
    emergencyDial: 'Urgențe',
    backToMainDashboard: 'Panou Principal',

    heroBadge: 'Control Acces Comercial și Inteligență pentru Porți',
    heroTitle: 'SECURE 24 DIN 7',
    heroSubtitle: 'Securitate Inteligentă • Acces Controlat • Protecție Completă',
    heroInstruction: 'Selectați țara, limba preferată și complexul rezidențial mai jos pentru a inițializa terminalele',

    localizationTitle: 'Control Internațional pentru Țară și Limbă',
    localizationSubtitle: 'Utilizați Secure 24 by 7 în 7 limbi internaționale cu numere de urgență regionale preconfigurate',
    countryLabel: 'Țară / Jurisdicție',
    languageLabel: 'Limba Interfeței',
    autoMatchLanguage: 'Limbă Activă',

    societySelectionTitle: 'Selectarea și Înregistrarea Complexului',
    requiredForManagement: 'NECESAR PENTRU ADMINISTRAȚIE',
    societySelectionDesc: 'Tastați numele complexului rezidențial pentru a căuta sau adăuga o nouă incintă. Conectat live cu agenții și locatarii.',
    registerNewSociety: 'Înregistrează Complex Nou',
    searchSocietyPlaceholder: 'Tastați numele complexului (ex: AEECHS, Grand Horizon, Green Valley...)',
    confirmSociety: 'Confirmă Complexul',
    registeredSocieties: 'Complexuri Înregistrate',
    readyToConnect: 'Gata de Conectare',
    activeBadge: 'ACTIV',
    selectAction: 'Selectează →',
    yourSocieties: 'Complexurile Dvs.:',
    verifiedSociety: 'COMPLEX VERIFICAT:',
    gatesCountLabel: 'Porți',
    housesCountLabel: 'Case',
    viewSocietyPageBtn: 'Vezi Pagina Complexului',
    createNewBadge: 'CREEAZĂ NOU',
    provisionStarterDesc: 'Click pentru a configura porți, registrul locatarilor și controlul barierelor',

    guardRoleTitle: 'Agent de Securitate',
    guardRoleBadge: 'CONSOLĂ POARTĂ',
    guardRoleDesc: 'Operațiuni rapide la poartă, scanare auto ANPR, înregistrare vizitatori, control bariere electronice și confirmare locatari.',
    guardRoleCta: 'Verifică ID și Intră',

    mgmtRoleTitle: 'Administrație',
    mgmtRoleBadge: 'ADMIN',
    mgmtRoleDesc: 'Centru de comandă, ture agenți, registrul locatarilor, analiză incidente, grilă CCTV, rapoarte și motor AI.',
    mgmtRoleCta: 'Intră în Admin',

    ownerRoleTitle: 'Suita Proprietarului',
    ownerRoleBadge: 'SUITĂ MASTER',
    ownerRoleDesc: 'Guvernanță multi-complex, scoruri de securitate, jurnale de audit executiv, starea sistemului și integrări hardware.',
    ownerRoleCta: 'Autentificare Master',

    rmpRoleTitle: 'Portal RMP',
    rmpRoleBadge: 'LOCATAR',
    rmpRoleDesc: 'Pre-notificări locatari pentru invitați, livrări și personal de serviciu cu recunoaștere automată a numărului auto.',
    rmpRoleCta: 'Deschide Portalul RMP',

    trustEncrypted: 'Acces Criptat End-to-End',
    trustMultiTenant: 'Izolare Multi-Complex a Datelor',
    trustLockout: 'Protecție cu Blocare la 3 Încercări Eșuate',
    footerText: 'SECURE 24 DIN 7 • SISTEM COMERCIAL DE GESTIUNE A PORȚILOR REZIDENȚIALE • PROTOCOL V4.2',

    modalRegisterTitle: 'Înregistrare Complex Rezidențial Nou',
    modalRegisterSubtitle: 'Configurați porțile, registrul locatarilor și controlul barierelor pentru complexul dvs.',
    societyNameField: 'Nume Complex / Ansamblu Rezidențial *',
    cityField: 'Oraș *',
    provinceField: 'Județ / Provincie',
    addressField: 'Adresă Completă / Bulevard Principal',
    autoProvisionTitle: 'CONFIGURARE AUTOMATĂ:',
    autoProvision1: '• 2 Bariere inteligente cu camere ANPR (Poarta Principală Nord și Poarta Secundară)',
    autoProvision2: '• Registrul locatarilor inițializat cu verificarea numerelor de înmatriculare',
    autoProvision3: '• Conexiune instantanee cu consola Agentului, suita Proprietarului și motorul AI',
    cancelBtn: 'Anulează',
    registerAndConnectBtn: 'Înregistrează și Conectează'
  }
};

interface LanguageContextValue {
  language: LanguageCode;
  languageOption: LanguageOption;
  country: CountryOption;
  setLanguage: (lang: LanguageCode) => void;
  setCountryByCode: (countryCode: string, autoSwitchLang?: boolean) => void;
  t: TranslationDictionary;
  tr: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_LANG_KEY = 'sec247_selected_language';
const STORAGE_COUNTRY_KEY = 'sec247_selected_country';

// WeakMaps to store canonical English text for DOM nodes and attributes so switching languages is 100% lossless
const originalTextMap = new WeakMap<Text, string>();
const lastTranslatedTextMap = new WeakMap<Text, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();
const originalTitleMap = new WeakMap<Element, string>();

function applyDOMTranslations(root: HTMLElement, lang: LanguageCode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const currentVal = textNode.nodeValue || '';
    if (!currentVal.trim()) continue;

    // If React updated the textNode since our last translation pass, update the canonical source
    const lastTranslated = lastTranslatedTextMap.get(textNode);
    if (!originalTextMap.has(textNode) || (lastTranslated !== undefined && currentVal !== lastTranslated)) {
      originalTextMap.set(textNode, currentVal);
    }

    const sourceText = originalTextMap.get(textNode) || currentVal;
    const nextText = lang === 'en' ? sourceText : translateString(sourceText, lang);
    if (currentVal !== nextText) {
      textNode.nodeValue = nextText;
    }
    lastTranslatedTextMap.set(textNode, nextText);
  }

  // Translate input/textarea placeholders and element titles
  const elements = root.querySelectorAll('input[placeholder], textarea[placeholder], [title]');
  elements.forEach((el) => {
    if (el.hasAttribute('placeholder')) {
      const curPh = el.getAttribute('placeholder') || '';
      if (!originalPlaceholderMap.has(el)) {
        originalPlaceholderMap.set(el, curPh);
      }
      const srcPh = originalPlaceholderMap.get(el) || curPh;
      const nextPh = lang === 'en' ? srcPh : translateString(srcPh, lang);
      if (curPh !== nextPh) {
        el.setAttribute('placeholder', nextPh);
      }
    }
    if (el.hasAttribute('title')) {
      const curTitle = el.getAttribute('title') || '';
      if (!originalTitleMap.has(el)) {
        originalTitleMap.set(el, curTitle);
      }
      const srcTitle = originalTitleMap.get(el) || curTitle;
      const nextTitle = lang === 'en' ? srcTitle : translateString(srcTitle, lang);
      if (curTitle !== nextTitle) {
        el.setAttribute('title', nextTitle);
      }
    }
  });
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY) as LanguageCode | null;
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const [countryCode, setCountryCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COUNTRY_KEY);
      if (saved && SUPPORTED_COUNTRIES.some(c => c.code === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'PK';
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // ignore
    }
  };

  const setCountryByCode = (code: string, autoSwitchLang = false) => {
    const found = SUPPORTED_COUNTRIES.find(c => c.code === code);
    if (found) {
      setCountryCode(found.code);
      try {
        localStorage.setItem(STORAGE_COUNTRY_KEY, found.code);
      } catch {
        // ignore
      }
      if (autoSwitchLang) {
        setLanguage(found.defaultLanguage);
      }
    }
  };

  const languageOption = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode) || SUPPORTED_COUNTRIES[0];
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const tr = (text: string) => translateString(text, language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = languageOption.dir;
  }, [language, languageOption.dir]);

  // Real-time Full-App DOM Translation across all portals, modals, tabs, and society names
  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;

    let isApplying = false;
    let rafId: number | null = null;

    const runTranslation = () => {
      if (isApplying || !containerRef.current) return;
      isApplying = true;
      try {
        applyDOMTranslations(containerRef.current, language);
      } finally {
        isApplying = false;
      }
    };

    runTranslation();

    const observer = new MutationObserver(() => {
      if (isApplying) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        runTranslation();
      });
    });

    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        languageOption,
        country,
        setLanguage,
        setCountryByCode,
        t,
        tr
      }}
    >
      <div ref={containerRef} dir={languageOption.dir} className="min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
