// config.js - ملف الإعدادات المشترك
let STORE_CONFIG = {};

// دالة لتحميل الإعدادات من GitHub
async function loadRemoteConfig() {
  return new Promise(async (resolve) => {
    try {
      const configUrl = 'https://raw.githubusercontent.com/ahcene43/Inas/main/config.json?t=' + Date.now();
      const response = await fetch(configUrl);
      
      if (response.ok) {
        const remoteConfig = await response.json();
        STORE_CONFIG = remoteConfig; // استبدال كامل
        console.log('✅ تم تحميل الإعدادات من الخادم');
        resolve(true);
      } else {
        console.log('❌ فشل تحميل الإعدادات من الخادم');
        resolve(false);
      }
    } catch (error) {
      console.log('⚠️ خطأ في تحميل الإعدادات من الخادم', error);
      resolve(false);
    }
  });
}

// تحميل الإعدادات المحفوظة محلياً (للنسخ الاحتياطي فقط)
function loadConfig() {
  // أولاً نحاول تحميل من الخادم
  loadRemoteConfig();
  
  // ثم نحمّل من localStorage كنسخة احتياطية
  const saved = localStorage.getItem('storeConfig');
  if (saved) {
    try {
      const parsedConfig = JSON.parse(saved);
      // ندمج فقط إذا كان الخادم فشل
      if (Object.keys(STORE_CONFIG).length === 0) {
        STORE_CONFIG = parsedConfig;
      }
    } catch (e) {
      console.error('Error loading local config:', e);
    }
  }
  
  // إذا لم توجد أي إعدادات، نستخدم الافتراضية
  if (Object.keys(STORE_CONFIG).length === 0) {
    STORE_CONFIG = getDefaultConfig();
  }
  
  return STORE_CONFIG;
}

// الإعدادات الافتراضية (للطوارئ فقط)
function getDefaultConfig() {
  return {
    PRODUCTS: {
      1: { 
        name: "مودال 1", 
        price: 3300, 
        image: "images/modal1.jpg", 
        description: "تصميم مريح وعصري مع تفاصيل راقية تناسب جميع المناسبات",
        availableSizes: ["S", "M", "L"],
        availableColors: ["كما في الصورة", "أبيض", "أسود", "أزرق"]
      }
    },
    DELIVERY_PRICES: {
      "00 - إختر الولاية": { home: 0, desk: 0 },
      "16 - الجزائر": { home: 500, desk: 250 }
    },
    DISCOUNTS: {
      minQuantityForDiscount: 2,
      discountPerItem: 300
    },
    STORE_INFO: {
      name: "BEN&KRAB-Shopp",
      tagline: "متجر أفخم الملابس للأطفال",
      phoneNumbers: ["0671466489", "0551102155"]
    },
    AGE_SIZES: {
      3: "S", 4: "S", 5: "S", 
      6: "M", 7: "M", 
      8: "L", 9: "L", 
      10: "XL", 11: "XL", 12: "XL"
    },
    AVAILABLE_COLORS: [
      "كما في الصورة", "أبيض", "أسود", "رمادي", "أزرق", 
      "أحمر", "أخضر", "زهري", "بنفسجي", "أصفر", "برتقالي", "ذهبي"
    ],
    AVAILABLE_SIZES: ["S", "M", "L", "XL", "XXL"]
  };
}

// حفظ الإعدادات محلياً
function saveConfig(config = STORE_CONFIG) {
  localStorage.setItem('storeConfig', JSON.stringify(config));
  
  if (typeof updateLiveStore === 'function') {
    updateLiveStore();
  }
}

// دالة للحفظ على GitHub (تُستدعى من الادمن)
async function saveToGitHub(config) {
  try {
    const githubConfig = JSON.parse(localStorage.getItem('github_config') || '{}');
    
    if (!githubConfig.token || !githubConfig.username || !githubConfig.repo) {
      throw new Error('إعدادات GitHub غير مكتملة');
    }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 2))));
    
    // محاولة الحصول على الـ SHA للملف الموجود
    let sha = '';
    try {
      const existingFile = await fetch(`https://api.github.com/repos/${githubConfig.username}/${githubConfig.repo}/contents/config.json`, {
        headers: {
          'Authorization': `token ${githubConfig.token}`
        }
      });
      
      if (existingFile.ok) {
        const fileData = await existingFile.json();
        sha = fileData.sha;
      }
    } catch (error) {
      // الملف غير موجود، سيتم إنشاؤه
    }

    const response = await fetch(`https://api.github.com/repos/${githubConfig.username}/${githubConfig.repo}/contents/config.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubConfig.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'تحديث إعدادات المتجر - ' + new Date().toLocaleString('ar-EG'),
        content: content,
        sha: sha,
        branch: githubConfig.branch || 'main'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في حفظ الإعدادات على GitHub');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving to GitHub:', error);
    throw error;
  }
}

// تحميل الإعدادات عند استيراد الملف
loadConfig();
