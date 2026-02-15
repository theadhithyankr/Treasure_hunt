# 🚀 Quick Setup Instructions

## Option 1: Manual Setup (What you're doing now)

### Step 1: Add the `role` field
In the Firebase Console where you are now:
1. Click **"+ Add field"**
2. Field name: `role`
3. Type: `string`
4. Value: `coordinator`
5. Click **Save**

**Done!** You can now login with your coordinator credentials.

---

## Option 2: Automated Setup (Recommended)

Run the setup script to automatically create everything:

```bash
node setup-firebase.js
```

This will create:
- ✅ Coordinator account (email: `coordinator@treasurehunt.com`, password: `Coordinator123!`)
- ✅ 3 sample teams with codes: `ALPHA1`, `BETA22`, `GAMMA3`
- ✅ 3 sample clues (scan, photo, text types)
- ✅ Welcome announcement

---

## 🎯 After Setup

### Login as Coordinator
1. Go to `http://localhost:5173/coordinator/login`
2. Email: `coordinator@treasurehunt.com`
3. Password: `Coordinator123!`

### Test as Player
1. Go to `http://localhost:5173/player/login`
2. Enter team code: `ALPHA1` (or `BETA22`, `GAMMA3`)
3. Enter your name
4. Start solving clues!

### View on Phone
Your dev server is running with `npm run dev:mobile`
- Check the terminal for the Network URL (e.g., `http://192.168.x.x:5173`)
- Open that URL on your phone (must be on same WiFi)

---

## 📝 Manual Data Entry (If you prefer)

### Create a Team
1. Login as coordinator
2. Go to **Teams** tab
3. Click **"+ New Team"**
4. Enter name and save
5. Note the 6-digit code

### Create a Clue
1. Go to **Clues** tab
2. Click **"+ New Clue"**
3. Fill in:
   - Title: "Find the Treasure"
   - Content: "Look under the big tree"
   - Type: Text/Photo/Scan
   - Correct Answer: "treasure"
4. Save

### Test the Flow
1. Open new browser tab
2. Join as player with team code
3. Solve the clue
4. As coordinator, approve the submission
5. Check leaderboard!

---

## 🔧 Troubleshooting

**Can't login as coordinator?**
- Make sure you added the `role: "coordinator"` field in Firestore

**Team code doesn't work?**
- Check that the team exists in Firestore `teams` collection
- Code is case-sensitive

**Submissions not showing?**
- Check Firebase Console → Firestore → `submissions` collection
- Make sure you're logged in as the correct team

---

**Need help?** Just ask! 🙋‍♂️
