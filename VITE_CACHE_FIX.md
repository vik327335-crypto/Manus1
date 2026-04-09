# Решение проблем с кэшем браузера в Vite

## Проблема

Браузер кэширует старый скрипт `@vite/client`, что приводит к ошибке:
```
[vite] failed to connect to websocket
```

Это происходит потому что:
1. Старый HTML содержал `@vite/client` скрипт
2. Браузер кэшировал этот скрипт
3. Новый HTML без `@vite/client` не переопределяет кэш
4. Браузер пытается загрузить старый скрипт и получает 404

## Текущее решение в проекте

В `vite.config.ts` уже реализовано:

```typescript
function vitePluginStripHmr(): Plugin {
  return {
    name: 'vite-plugin-strip-hmr',
    transformIndexHtml(html) {
      // Remove @vite/client script tags
      return html.replace(/<script[^>]*@vite\/client[^>]*><\/script>/g, '')
                 .replace(/<script[^>]*type="module"[^>]*src="\/@vite\/client"[^>]*><\/script>/g, '')
                 .replace(/<script[^>]*src="\/@vite\/client"[^>]*type="module"[^>]*><\/script>/g, '')
                 .replace(/<script[^>]*src="\/@vite\/client"[^>]*><\/script>/g, '')
                 .replace(/<script[^>]*@vite\/client[^>]*type="module"[^>]*><\/script>/g, '');
    },
  };
}
```

И в конфиге:
```typescript
server: {
  hmr: false,  // ← Отключает HMR полностью
  host: '0.0.0.0',
  allowedHosts: ['**'],
  fs: {
    strict: true,
    deny: ["**/..*"],
  },
}
```

## Дополнительные рекомендации

### 1. Добавить Cache-Control headers

В `server/_core/index.ts` или Express middleware:

```typescript
app.use((req, res, next) => {
  // Не кэшировать HTML
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Кэшировать статические файлы на 1 год
  else if (/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/.test(req.path)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});
```

### 2. Добавить версионирование файлов

В `vite.config.ts`:

```typescript
build: {
  rollupOptions: {
    output: {
      entryFileNames: '[name]-[hash].js',
      chunkFileNames: '[name]-[hash].js',
      assetFileNames: '[name]-[hash][extname]',
    },
  },
}
```

### 3. Использовать Service Worker для контроля кэша

Создать `client/public/sw.js`:

```javascript
const CACHE_NAME = 'canslim-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Не кэшировать HTML
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Кэшировать остальное
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

Зарегистрировать в `client/src/main.tsx`:

```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Ignore SW registration errors
  });
}
```

### 4. Добавить скрипт для очистки кэша при обновлении

В `client/src/main.tsx`:

```typescript
// Проверить версию приложения и очистить кэш если изменилась
const checkVersion = async () => {
  try {
    const response = await fetch('/version.json');
    const { version: newVersion } = await response.json();
    const oldVersion = localStorage.getItem('app-version');
    
    if (oldVersion && oldVersion !== newVersion) {
      // Версия изменилась - очистить кэш
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }
      localStorage.clear();
    }
    
    localStorage.setItem('app-version', newVersion);
  } catch (error) {
    console.error('Failed to check version:', error);
  }
};

checkVersion();
```

Создать `client/public/version.json`:

```json
{
  "version": "1.0.0"
}
```

### 5. Добавить ETag для HTML

В Express middleware:

```typescript
import { createHash } from 'crypto';

app.get('/', (req, res, next) => {
  // Генерировать ETag для HTML
  const etag = createHash('md5')
    .update(htmlContent)
    .digest('hex');
  
  res.setHeader('ETag', `"${etag}"`);
  res.setHeader('Cache-Control', 'no-cache');
  
  if (req.headers['if-none-match'] === `"${etag}"`) {
    res.status(304).end();
    return;
  }
  
  res.send(htmlContent);
});
```

## Для пользователей

Если ошибка всё ещё появляется:

1. **Быстрое решение:** Ctrl+Shift+Delete → Clear site data → Refresh
2. **Альтернатива:** F12 → Application → Storage → Clear site data
3. **Или:** Правый клик на кнопку refresh → "Empty cache and hard refresh"

## Проверка

Убедитесь что:
- ✅ HTML не содержит `@vite/client`
- ✅ `hmr: false` в vite.config.ts
- ✅ Cache-Control headers установлены
- ✅ Файлы версионированы (hash в имени)

## Тестирование

```bash
# Проверить что @vite/client не в HTML
curl -s http://localhost:3000/ | grep "@vite/client"
# Должно быть пусто

# Проверить Cache-Control headers
curl -I http://localhost:3000/
# Должно быть: Cache-Control: no-cache, no-store, must-revalidate, max-age=0
```

## Статус в проекте

- ✅ HMR отключен (`hmr: false`)
- ✅ @vite/client удаляется из HTML (vitePluginStripHmr)
- ⚠️ Cache-Control headers нужно добавить
- ⚠️ Service Worker опционально
- ⚠️ Версионирование файлов рекомендуется
