# 🔧 Quick Fix for Permission Error

You're seeing "Missing or insufficient permissions" because the Firestore rules need to be updated.

## ⚡ Quick Solution (2 minutes):

### Step 1: Go to Firebase Console
Open: https://console.firebase.google.com/project/one-piece-b5d33/firestore/rules

### Step 2: Replace ALL the rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Click "Publish"

### Step 4: Go back to http://localhost:5173/setup and click the button again

---

## 🎯 What This Does:

This rule allows **anyone** to read and write to your database. It's perfect for development and testing!

⚠️ **Note:** For production, you'll want more restrictive rules, but for now this will let you test everything!

---

## Alternative: Manual Data Entry (5 minutes)

If you prefer, I can guide you to manually create:
1. One team in Firestore
2. One clue in Firestore

Then you can test the full app flow!

**Which would you prefer?**
