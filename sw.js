'use strict';
// 为什么打开就有一个通知

const applicationServerPublicKey = 'BEIncnp9ZzatTv04uwdwkjhPzhi4tJjsaZ7LaXWSUBy_-Aa9H_KDW1DoYVDDS6bdPeVHGdb0lbZK-ty3SdHUB-s0';

const version = '1.0.0',
  CACHE = version + '::PWAsite',
  offlineURL = 'pages/offlinePage/',
  installFilesEssential = [
    '/',
    '/manifest.json',
    '/styles/index.css',
    '/scripts/main.js',
    '/scripts/initDB.js',
    '/images/jumao.jpg'
  ].concat(offlineURL)


function installStaticFiles() {
  return caches.open(CACHE).then(cache => {
    return cache.addAll(installFilesEssential);
  });
}


function clearOldCaches() {
  return caches.keys().then(keylist => {
    return Promise.all(keylist.filter(key => key !== CACHE).map(key => caches.delete(key)));
  });
}

// application installation
self.addEventListener('install', event => {
  //加载静态文件
  console.log('service worker: install');
  // cache core files 用waitUnit的promise结果，决定是否进入activing状态,因为sw可能任意时间结束，起到了延迟结束
  // skipWaiting 使线程直接进入activing状态
  event.waitUntil(installStaticFiles().then(() => self.skipWaiting()));
});

// application activated
// 你可以在activate事件中通过调用clients.claim()来让没被控制的 clients 受控。
self.addEventListener('activate', event => {
  console.log('service worker: activate');
  // 删除无用的老得缓存
  event.waitUntil(clearOldCaches().then(() =>
  //可以通过查看navigator.serviceWorker.controller是否为 null 来查看一个client是否被 SW 控制
  //仅当 SW 激活并且clients.claim()被调用成功在图片请求之前的时候才可以。我感觉没啥用。。。。
  self.clients.claim()));
});


// return offline asset
function offlineAsset(url) {
  return caches.match(offlineURL);
}

// active状态可以监听这些fetch push sycn之类的事件
self.addEventListener('fetch', event => {
	// 其他类型请求没有进行fetch的拦截处理，直接进行
  if (event.request.method !== 'GET')
    return;

  let url = event.request.url;
  event.respondWith(caches.open(CACHE).then(cache => {
    return cache.match(event.request).then(response => {
      if (response) {
        // return cached file
        console.log('cache fetch: ' + url);
        return response;
      }
      // make network request
      return fetch(event.request).then(newreq => {
        console.log('network fetch: ' + url);
        if (newreq.ok)
          cache.put(event.request, newreq.clone());
        return newreq;
      })
      // 离线
        .catch(() => offlineAsset(url));
    });
  }));
});


function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Push Codelab';
  const options = {
    body: `data: "${event.data.text()}"`,
    icon: 'images/icon.png',
    badge: 'images/badge.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();
  // service 里面的一个新的 API clients？？？
  // 我们可以将 Clients 理解为我们现在所在的浏览器，不过特殊的地方在于，它是遵守同域规则的，即，你只能操作和你域名一致的窗口。
  // 同样，Clients 也只是一个集合，用来管理你当前所有打开的页面，实际上，每个打开的页面都是使用一个 cilent object 进行表示的
  // Client.postMessage(msg[,transfer]): 用来和指定的窗口进行通信
  // Client.frameType: 表明当前窗口的上下文。该值可以为: auxiliary, top-level, nested, 或者 none.
  // Client.id[String]: 使用一个唯一的 id 表示当前窗口
  // Client.url: 当前窗口的 url。
  // WindowClient.focus()： 该方法是用来聚焦到当前 SW 控制的页面。下面几个也是 Client，不过是专门针对 type=window 的client。
  // WindowClient.navigate(url): 将当前页面到想到指定 url
  // WindowClient.focused[boolean]: 表示用户是否停留在当前 client
  // WindowClient.visibilityState: 用来表示当前 client 的可见性。实际和 focused 没太大的区别。可取值为: hidden, visible, prerender, or unloaded。
  event.waitUntil(clients.openWindow('https://developers.google.com/web/'));
});

//？？？？
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker]: \'pushsubscriptionchange\' event fired.');
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  event.waitUntil(self.registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: applicationServerKey}).then(function(newSubscription) {
    // TODO: Send to application server
    console.log('[Service Worker] New subscription: ', newSubscription);
  }));
});

self.addEventListener('sync', event => {
  if (event.tag === 'submit') {
    console.log('sync!')
    fetch('http://localhost:3002/send_sync_query', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({data: 'this is a sync query'})
    }).then(function(response) {
      return response.json()
    }).then(function(jsonRes) {
      //通信给原页面
      console.log(jsonRes)

      self.clients.matchAll({includeUncontrolled: true}).then(function(clients) {
        if (clients && clients.length) {
          clients.forEach(function(client) {
            const url = new URL(client.url);
            if (url.pathname === '/') {
              client.postMessage({type: 'sync_query_res', jsonRes



              : jsonRes});
            }
          })
        }
      })
    })
  }
})
