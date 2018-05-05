(function() {
  const urlFetchDaoFunc = function() {
    let indexedDB = window.indexedDB || window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    let indexDBConfig = {
      DBName: 'pwa',
      DBVersion: 1,
      urlFetchStorageName: 'url_fectch_store'
    }
    let DBName = indexDBConfig.DBName
    let DBVersion = indexDBConfig.DBVersion
    let urlFetchStorageName = indexDBConfig.urlFetchStorageName
    let db;
    this.init = function() {
      return new Promise((resolve, reject) => {
        if (db) {
          resolve()
          return;
        }
        let req = indexedDB.open(DBName)
        req.onsuccess = function(e) {
          db = req.result;
          resolve()
        }
        req.onerror = function() {
          reject()
        }
      })
    }
    this.insertRes = function(data) {
      return new Promise((resolve, reject) => {
        let tx = db.transaction(urlFetchStorageName, 'readwrite');
        tx.oncomplete = function() {
          resolve()
        }
        let store = tx.objectStore(urlFetchStorageName)
        store.put(data)
      })
    }
    this.queryRes = function(url) {
      return new Promise((resolve, reject) => {
        let tx = db.transaction(urlFetchStorageName, 'readwrite');
        let store = tx.objectStore(urlFetchStorageName);
        let req = store.get(url);
        req.onsuccess = function() {
          resolve(this.result)
        }
        req.onerror = function() {
          reject()
        }
      })
    }
  }
  const urlFetchDao = new urlFetchDaoFunc()
  function getContentFromServer() {
    fetch('http://localhost:3002/query_page_a_content', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({data: 'query from page a'})
    }).then((res) => {
      if (res.status === 200) {
        console.log(res)
        return res.json()
      } else {
        urlFetchDao.init().then(() => {
          urlFetchDao.queryRes('query_page_a_content').then((indexDbRes) => {
            renderPageADom(indexDbRes)
          })
        })
      }
    }, (err) => {
      console.log(err)
      urlFetchDao.init().then(() => {
        urlFetchDao.queryRes('query_page_a_content').then((indexDbRes) => {
          renderPageADom(indexDbRes)
        })
      })
    }).then((resJson) => {
      if(!resJson){
        return
      }
      console.log(resJson)
      let data = resJson.data
      renderPageADom(data)
      //存indexDB
      urlFetchDao.init().then(() => {
        urlFetchDao.insertRes({url: 'query_page_a_content', data: data})
      })
    })
  }

  function renderPageADom(data) {
    document.getElementById('page-a-content').textContent = JSON.stringify(data)
  }
  
  window.onload = function() {
    getContentFromServer()
  }
})()
