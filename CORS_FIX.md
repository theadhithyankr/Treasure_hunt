# Firebase Storage CORS Configuration

## The Problem
You're seeing CORS errors because Firebase Storage needs to be configured to accept requests from your localhost.

## Solution: Configure CORS for Firebase Storage

### Step 1: Create a CORS configuration file

Create a file called `cors.json` with this content:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

### Step 2: Install Google Cloud SDK

Download from: https://cloud.google.com/sdk/docs/install

### Step 3: Apply CORS configuration

Run this command in your terminal:

```bash
gsutil cors set cors.json gs://one-piece-b5d33.firebasestorage.app
```

---

## Quick Alternative: Use Firebase Storage Rules Instead

Go to Firebase Console → Storage → Rules and use:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

Then click **Publish**.

---

## Temporary Workaround

For now, you can test without images:
1. Create clues without uploading images
2. Use text-only or scan-type clues
3. Test the photo submission feature after fixing CORS

The CORS issue only affects image uploads, everything else should work fine!
