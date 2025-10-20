// config.js - ملف الإعدادات المشترك
let STORE_CONFIG = {};

async function loadRemoteConfig() {
  return new Promise(async (resolve) => {
    try {
      const stores = JSON.parse(localStorage.getItem('stores') || '{}');
      const currentStore = localStorage.getItem('currentStore');
      let configUrl = 'https://raw.githubusercontent.com/username/repo/main/config.json';
      
      if (currentStore && stores[currentStore] && stores[currentStore].github) {
        const githubConfig = stores[currentStore].github;
        if (githubConfig.username && githubConfig.repo) {
          configUrl = `https://raw.githubusercontent.com/${githubConfig.username}/${githubConfig.repo}/${githubConfig.branch || 'main'}/config.json`;
        }
      }
      
      const response = await fetch(configUrl + '?t=' + Date.now());
      
      if (response.ok) {
        const remoteConfig = await response.json();
        STORE_CONFIG = remoteConfig;
        console.log('✅ Paramètres chargés depuis: ' + configUrl);
        resolve(true);
      } else {
        console.log('❌ Échec du chargement depuis: ' + configUrl);
        resolve(false);
      }
    } catch (error) {
      console.log('⚠️ Erreur lors du chargement des paramètres:', error);
      resolve(false);
    }
  });
}

function loadConfig() {
  loadRemoteConfig();
  
  const saved = localStorage.getItem('storeConfig');
  if (saved) {
    try {
      const parsedConfig = JSON.parse(saved);
      if (Object.keys(STORE_CONFIG).length === 0) {
        STORE_CONFIG = parsedConfig;
      }
    } catch (e) {
      console.error('Erreur lors du chargement de la configuration locale:', e);
    }
  }
  
  if (Object.keys(STORE_CONFIG).length === 0) {
    STORE_CONFIG = getDefaultConfig();
  }
  
  return STORE_CONFIG;
}

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
      name: "متجرك الإلكتروني",
      tagline: "أفخم الملابس للأطفال",
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

function saveConfig(config = STORE_CONFIG) {
  localStorage.setItem('storeConfig', JSON.stringify(config));
}

async function saveToGitHub(config, githubConfig) {
  try {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 2))));
    
    let sha = '';
    try {
      const existingFile = await fetch(`https://api.github.com/repos/${githubConfig.username}/${githubConfig.repo}/contents/config.json`, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (existingFile.ok) {
        const fileData = await existingFile.json();
        sha = fileData.sha;
      }
    } catch (error) {
      console.log('Fichier non existant, création en cours');
    }

    const response = await fetch(`https://api.github.com/repos/${githubConfig.username}/${githubConfig.repo}/contents/config.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubConfig.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'Mise à jour des paramètres du magasin - ' + new Date().toLocaleString('fr-FR'),
        content: content,
        sha: sha,
        branch: githubConfig.branch || 'main'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Échec de la sauvegarde des paramètres sur GitHub');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde sur GitHub:', error);
    throw error;
  }
}

async function saveToGitHubWithToken(config, githubConfig) {
  return await saveToGitHub(config, githubConfig);
}

async function loadRemoteConfigWithToken(githubConfig) {
  return new Promise(async (resolve) => {
    try {
      const configUrl = `https://raw.githubusercontent.com/${githubConfig.username}/${githubConfig.repo}/${githubConfig.branch || 'main'}/config.json?t=${Date.now()}`;
      const response = await fetch(configUrl);
      
      if (response.ok) {
        const remoteConfig = await response.json();
        STORE_CONFIG = remoteConfig;
        console.log('✅ Paramètres chargés depuis le serveur');
        resolve(true);
      } else {
        console.log('❌ Échec du chargement des paramètres depuis le serveur');
        resolve(false);
      }
    } catch (error) {
      console.log('⚠️ Erreur lors du chargement des paramètres depuis le serveur', error);
      resolve(false);
    }
  });
}

loadConfig();
