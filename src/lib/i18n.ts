export type Lang = 'bn' | 'en';

const translations = {
  // Navigation
  'nav.dashboard': { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  'nav.meals': { bn: 'মিল', en: 'Meals' },
  'nav.bazar': { bn: 'বাজার', en: 'Bazar' },
  'nav.payments': { bn: 'পেমেন্ট', en: 'Payments' },
  'nav.reports': { bn: 'রিপোর্ট', en: 'Reports' },
  'nav.settings': { bn: 'সেটিংস', en: 'Settings' },

  // Auth
  'auth.login': { bn: 'লগইন', en: 'Login' },
  'auth.signup': { bn: 'রেজিস্ট্রেশন', en: 'Sign Up' },
  'auth.logout': { bn: 'লগআউট', en: 'Logout' },
  'auth.email': { bn: 'ইমেইল', en: 'Email' },
  'auth.password': { bn: 'পাসওয়ার্ড', en: 'Password' },
  'auth.fullName': { bn: 'পুরো নাম', en: 'Full Name' },
  'auth.noAccount': { bn: 'অ্যাকাউন্ট নেই?', en: "Don't have an account?" },
  'auth.hasAccount': { bn: 'অ্যাকাউন্ট আছে?', en: 'Already have an account?' },

  // Dashboard
  'dashboard.title': { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  'dashboard.totalMeals': { bn: 'মোট মিল', en: 'Total Meals' },
  'dashboard.totalBazar': { bn: 'মোট বাজার', en: 'Total Bazar' },
  'dashboard.mealRate': { bn: 'মিল রেট', en: 'Meal Rate' },
  'dashboard.myMeals': { bn: 'আমার মিল', en: 'My Meals' },
  'dashboard.myCost': { bn: 'আমার খরচ', en: 'My Cost' },
  'dashboard.myPaid': { bn: 'আমার জমা', en: 'My Paid' },
  'dashboard.myBalance': { bn: 'আমার ব্যালেন্স', en: 'My Balance' },
  'dashboard.quickActions': { bn: 'দ্রুত অ্যাকশন', en: 'Quick Actions' },
  'dashboard.addMeal': { bn: 'মিল যোগ', en: 'Add Meal' },
  'dashboard.addBazar': { bn: 'বাজার যোগ', en: 'Add Bazar' },
  'dashboard.addPayment': { bn: 'পেমেন্ট যোগ', en: 'Add Payment' },

  // Meals
  'meals.title': { bn: 'মিল ম্যানেজমেন্ট', en: 'Meal Management' },
  'meals.breakfast': { bn: 'সকাল', en: 'Breakfast' },
  'meals.lunch': { bn: 'দুপুর', en: 'Lunch' },
  'meals.dinner': { bn: 'রাত', en: 'Dinner' },
  'meals.markAll': { bn: 'সব সিলেক্ট', en: 'Mark All' },
  'meals.save': { bn: 'সেভ করুন', en: 'Save' },
  'meals.units': { bn: 'ইউনিট', en: 'Units' },

  // Bazar
  'bazar.title': { bn: 'বাজার তালিকা', en: 'Bazar List' },
  'bazar.add': { bn: 'বাজার যোগ করুন', en: 'Add Bazar' },
  'bazar.date': { bn: 'তারিখ', en: 'Date' },
  'bazar.amount': { bn: 'পরিমাণ (৳)', en: 'Amount (৳)' },
  'bazar.description': { bn: 'বিবরণ', en: 'Description' },
  'bazar.total': { bn: 'মোট বাজার', en: 'Total Bazar' },

  // Payments
  'payments.title': { bn: 'পেমেন্ট তালিকা', en: 'Payment List' },
  'payments.add': { bn: 'পেমেন্ট যোগ করুন', en: 'Add Payment' },
  'payments.member': { bn: 'সদস্য', en: 'Member' },
  'payments.amount': { bn: 'পরিমাণ (৳)', en: 'Amount (৳)' },
  'payments.method': { bn: 'মাধ্যম', en: 'Method' },
  'payments.note': { bn: 'নোট', en: 'Note' },
  'payments.total': { bn: 'মোট জমা', en: 'Total Paid' },

  // Reports
  'reports.title': { bn: 'মাসিক রিপোর্ট', en: 'Monthly Report' },
  'reports.member': { bn: 'সদস্য', en: 'Member' },
  'reports.opening': { bn: 'প্রারম্ভিক', en: 'Opening' },
  'reports.mealUnits': { bn: 'মিল ইউনিট', en: 'Meal Units' },
  'reports.mealCost': { bn: 'মিল খরচ', en: 'Meal Cost' },
  'reports.extraShare': { bn: 'অতিরিক্ত ভাগ', en: 'Extra Share' },
  'reports.totalCost': { bn: 'মোট খরচ', en: 'Total Cost' },
  'reports.paid': { bn: 'জমা', en: 'Paid' },
  'reports.net': { bn: 'নেট', en: 'Net' },
  'reports.closing': { bn: 'সমাপনী', en: 'Closing' },
  'reports.exportPdf': { bn: 'PDF ডাউনলোড', en: 'Download PDF' },
  'reports.exportExcel': { bn: 'Excel ডাউনলোড', en: 'Download Excel' },

  // Settings
  'settings.title': { bn: 'সেটিংস', en: 'Settings' },
  'settings.mealWeights': { bn: 'মিল ওজন', en: 'Meal Weights' },
  'settings.members': { bn: 'সদস্য ব্যবস্থাপনা', en: 'Member Management' },
  'settings.monthSelect': { bn: 'মাস নির্বাচন', en: 'Select Month' },
  'settings.theme': { bn: 'থিম', en: 'Theme' },
  'settings.language': { bn: 'ভাষা', en: 'Language' },
  'settings.dark': { bn: 'ডার্ক', en: 'Dark' },
  'settings.light': { bn: 'লাইট', en: 'Light' },
  'settings.extraCosts': { bn: 'অতিরিক্ত খরচ', en: 'Extra Costs' },
  'settings.active': { bn: 'সক্রিয়', en: 'Active' },
  'settings.inactive': { bn: 'নিষ্ক্রিয়', en: 'Inactive' },

  // Extra cost categories
  'extra.gas': { bn: 'গ্যাস', en: 'Gas' },
  'extra.electricity': { bn: 'বিদ্যুৎ', en: 'Electricity' },
  'extra.wifi': { bn: 'ওয়াইফাই', en: 'WiFi' },
  'extra.cleaner': { bn: 'পরিচ্ছন্নতা', en: 'Cleaner' },
  'extra.water': { bn: 'পানি', en: 'Water' },
  'extra.others': { bn: 'অন্যান্য', en: 'Others' },

  // Guest meals
  'meals.cutoffSettings': { bn: 'কাটঅফ টাইম সেটিংস', en: 'Cutoff Time Settings' },
  'meals.cutoffBreakfast': { bn: 'সকাল কাটঅফ', en: 'Breakfast Cutoff' },
  'meals.cutoffLunch': { bn: 'দুপুর কাটঅফ', en: 'Lunch Cutoff' },
  'meals.cutoffDinner': { bn: 'রাত কাটঅফ', en: 'Dinner Cutoff' },
  'meals.prevDay': { bn: 'আগের দিন', en: 'Previous Day' },
  'meals.sameDay': { bn: 'সেদিন', en: 'Same Day' },

  'meals.guest': { bn: 'গেস্ট', en: 'Guest' },
  'meals.guestCount': { bn: 'গেস্ট সংখ্যা', en: 'Guest Count' },
  'meals.guestMealUnits': { bn: 'গেস্ট মিল ইউনিট', en: 'Guest Meal Units' },
  'meals.timeOver': { bn: 'সময় শেষ', en: 'Time over' },
  'meals.myMeals': { bn: 'আমার মিল সেট করুন', en: 'Set My Meals' },
  'meals.cutoffPassed': { bn: 'কাটঅফ টাইম পার হয়েছে', en: 'Cutoff time has passed' },
  'meals.upcoming': { bn: 'আগামী দিনের মিল', en: 'Upcoming Meals' },

  // Common
  'common.save': { bn: 'সেভ', en: 'Save' },
  'common.cancel': { bn: 'বাতিল', en: 'Cancel' },
  'common.delete': { bn: 'মুছুন', en: 'Delete' },
  'common.edit': { bn: 'সম্পাদনা', en: 'Edit' },
  'common.add': { bn: 'যোগ করুন', en: 'Add' },
  'common.loading': { bn: 'লোড হচ্ছে...', en: 'Loading...' },
  'common.noData': { bn: 'কোনো ডেটা নেই', en: 'No data' },
  'common.taka': { bn: '৳', en: '৳' },
  'common.success': { bn: 'সফল!', en: 'Success!' },
  'common.error': { bn: 'ত্রুটি!', en: 'Error!' },
  'common.confirm': { bn: 'নিশ্চিত করুন', en: 'Confirm' },

  // App
  'app.name': { bn: 'মিল হিসাব', en: 'Meal Hisab' },
} as const;

export type TranslationKey = keyof typeof translations;

let currentLang: Lang = (localStorage.getItem('lang') as Lang) || 'bn';

export function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: TranslationKey): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[currentLang] || entry['bn'] || key;
}
