import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAkRqJq03uire2F9pG5-DMrOPHPJQA2V7I",
    authDomain: "socialconnect-fbd65.firebaseapp.com",
    projectId: "socialconnect-fbd65",
    storageBucket: "socialconnect-fbd65.firebasestorage.app",
    messagingSenderId: "480994653519",
    appId: "1:480994653519:web:960d8ad3e1f83e5278c13a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load JSON
const data = JSON.parse(fs.readFileSync("./db.json", "utf-8"));

// Helper function
const upload = async (collectionName, items) => {
    console.log(`Uploading ${collectionName}...`);

    for (const item of items) {
        await setDoc(doc(db, collectionName, item.id), item);
    }

    console.log(`${collectionName} done`);
};

// Run migration
const run = async () => {
    await upload("users", data.users);
    await upload("posts", data.posts);
    await upload("comments", data.comments);
    await upload("likes", data.likes);
    await upload("followers", data.followers);
    await upload("notifications", data.notifications);
    await upload("chats", data.chats);
    await upload("messages", data.messages);

    console.log("🔥 MIGRATION COMPLETE");
};

run();