"use strict";

// to store result target in global variable
let db; 

//create an object store called "pending"
const pendingStoreNameObject = `pending`;

// open DB for budget
const request = indexedDB.open(`budget`, 2);

request.onupgradeneeded = event => {
    //const
    db = request.result;

   // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
    db = event.target.result;
    console.log(event);

    
    // set  object stroe: "pending" autoIncrement to true
    if (!db.objectStoreNames.contains(pendingStoreNameObject)) {
        db.createObjectStore(pendingStoreNameObject, { autoIncrement: true });
    }
};

request.onsuccess = event => {
    console.log(`Success! ${event.type}`);
    // check if app is online before reading from db, if online run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = event => console.error(event);

function checkDatabase() {
    db = request.result;

    // open a transaction on your pending db
    const transaction = db.transaction([pendingStoreNameObject], `readwrite`);

    // access your pending object store
    const trObectStore = transaction.objectStore(pendingStoreNameObject);

    // get all records from trObectStore and set to a variable
    const getAll = trObectStore.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch(`/api/transaction/bulk`, {
                method: `POST`,
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: `application/json, text/plain, */*`,
                    "Content-Type": `application/json`
                }
            })
                .then(response => response.json())
                .then(() => {
                    // if successful, open a transaction on your pending db
                    transaction = db.transaction([pendingStoreNameObject], `readwrite`);

                    // access pending object store
                    trObectStore = transaction.objectStore(pendingStoreNameObject);

                    // clear all items from trObject store
                    trObectStore.clear();
                });
        }
    };
}

// to save record to the DB
function saveRecord(record) {
     db = request.result;

    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction([pendingStoreNameObject], `readwrite`);

    // access your pending object store
    const trObectStore = transaction.objectStore(pendingStoreNameObject);

    // add record to your store with add method.
    trObectStore.add(record);
}

// listen for app coming back online
window.addEventListener(`online`, checkDatabase);