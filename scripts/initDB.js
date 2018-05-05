
(function() {
  const initDB = function(){
    let indexedDB = window.indexedDB || window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if (!indexedDB) {
      window.alert("your browser can't support indexedDB")
    }

    let indexDBConfig = {
      DBName: 'pwa',
      DBVersion: 1,
      urlFetchStorageName: 'url_fectch_store'
    }
    let DBName = indexDBConfig.DBName
    let DBVersion = indexDBConfig.DBVersion
    let urlFetchStorageName = indexDBConfig.urlFetchStorageName
    let db;
    let req = indexedDB.open(DBName, DBVersion)

    req.onsuccess = function(e) {
      db = this.result;
      if (db.objectStoreNames.contains(urlFetchStorageName)) {
        console.log('indexDB初始化成功')
      } else {
        console.log('indexDB初始化失败，重试')
        indexedDB.deleteDatabase(DBName)
        setTimeout(initDB, 500)
      }
    }

    req.onerror = function(e) {
      console.log('init error', e.target.error)
    }

    req.onupgradeneeded = function(e) {
      console.log('upgrade')
      db = this.result;
      if(!db.objectStoreNames.contains(urlFetchStorageName)){
        db.createObjectStore(urlFetchStorageName,{keyPath: 'url'})
      }
    }
  }
  initDB();

})()
