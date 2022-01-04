// holds db connectiob 
let db;
// establish connection to IndexedDB set to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event emits database version changes if needed
request.onupgradeneeded = function (event) {
    // save reference to database
    const db = event.target.result;
    // create object store (table) called 'new_budget' with auto increment
    db.createObjectStore('new_budget', {autoIncrement: true});
};

// successful request
request.onsuccess = function (event) {
    // when successful, save to local 'db' variable
    db = event.target.result;
    // check if app is online, if yes run uploadBudget()
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// if there is no connection run this function instead
function saveBudget(data) {
    // open new transaction with database and read/write permissions
    const transaction = db.transaction(['new_budget'], 'readwrite');
    // access object store for new budget transaction
    const budgetObjectStore = transaction.objectStore('new_budget');
    // add transaction to the budget
    budgetObjectStore.add(data);
};

function uploadBudget() {
    // open transaction to database
    const transaction = db.transaction(['new_budget'], 'readwrite');
    // access objectStore
    const budgetObjectStore = transaction.objectStore('new_budget');
    // get all records and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a seccussful getAll(), run this function
    getAll.onsuccess = function() {
        // if there was data, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_budget'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_budget');
                // clear all items in the store
                budgetObjectStore.clear();
                alert('All new budget info has been submitted!')
            })
            .catch(err => console.log(err));
        }
    }
};

// listen for app to come back online
window.addEventListener('online', uploadBudget);