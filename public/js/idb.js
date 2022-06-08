let db; // store the database object

const request = indexedDB.open('budget_tracker-db', 1); // establish connection

request.onupgradeneeded = function (event) {
  const db = event.target.result; // save a reference to the database
  db.createObjectStore('transactions', { autoIncrement: true }); // define the table
};

request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    uploadTransactions();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(transactions) {
  db.transaction(['transactions'], 'readwrite') // open the table with read/write capabilities
    .objectStore('transactions') // access the objectStore
    .add(transactions); // add the transactions to the database
  console.log('User offline, transaction saved to budget_tracker-db');
}

function uploadTransactions() {
  const getAll = db
    .transaction(['transactions'], 'readwrite') // open the table with read/write capabilities
    .objectStore('transactions') // access the objectStore
    .getAll(); // get all records from the store

  getAll.onsuccess = function () {
    // upon getting all records, if records exist, post them and delete them from the indexedDB
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          db.transaction(['transactions'], 'readwrite') // open the table with read/write capabilities
            .objectStore('transactions') // access the objectStore
            .clear(); // clear all items out
          alert('All saved transactions have been uploaded');
        })
        .catch((err) => console.log(err));
    }
  };
}

window.addEventListener('online', uploadTransactions);
