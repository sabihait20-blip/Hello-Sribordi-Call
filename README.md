# 📞 Calling & Messaging Web App (WebRTC + Firebase)

একটি সম্পূর্ণ প্রোডাকশন-রেডি **Real-Time Audio & Video Calling Web Application** যা React, TypeScript, Tailwind CSS, WebRTC এবং Firebase দিয়ে তৈরি।

---

## 🚀 প্রধান বৈশিষ্ট্যসমূহ (Features)

* **Real-Time Audio & Video Calling:** WebRTC এবং Firestore-ভিত্তিক real-time signaling ব্যবহার করে পয়েন্ট-টু-পয়েন্ট অডিও ও ভিডিও কল।
* **Firebase Authentication:** ইমেইল/পাসওয়ার্ড রেজিস্টার, লগইন, গুগল লগইন (OAuth), পাসওয়ার্ড রিসেট এবং প্রোফাইল আপডেট।
* **Firestore User Database & Presence:** ব্যবহারকারীর প্রোফাইল তথ্য, নাম, ইউজারনেম, বায়ো, রিয়েল-টাইম অনলাইন/অফলাইন স্টেট (`isOnline`) এবং `lastSeen` ট্র্যাকিং।
* **User Search & Contacts:** নাম, ইউজারনেম বা ইমেইল দিয়ে ইউজার সার্চ করা এবং ফ্রেন্ডস/কনট্যাক্টস লিস্টে যোগ/রিমুভ করা।
* **1-on-1 Instant Messaging:** রিয়েল-টাইম চ্যাট সিস্টেম, ম্যাসেজ দেখা স্টেট (`seen`), ইমোজি, ইমেজ শেয়ারিং এবং চ্যাট স্ক্রিন থেকে সরাসরি অডিও/ভিডিও কল বাটন।
* **ImgBB API Image Hosting:** দ্রুত ও নিরবচ্ছিন্ন প্রোফাইল ছবি এবং চ্যাট ইমেজ আপলোডের জন্য ImgBB Cloud API ইন্টিগ্রেশন (`5a96450548a710e6f8cf39c709ed732a`)।
* **Call History & Redial:** ইনকামিং, আউটগোয়িং, মিসড কল লিস্টিং এবং ডিউরেশন ও ফিল্টার সুবিধা।
* **Dynamic Ringtone & Audio:** Web Audio API চালিত রিয়েল রিংটোন এবং কল এন্ড সাউন্ড ইফেক্ট।
* **Responsive Dark/Light Mode:** মোবাইল এবং ডেসকটপ উভয়ের জন্যই উপযোগী রেসপন্সিভ লেআউট (Sidebar & Bottom Navigation)।

---

## 🛠️ সেটআপ নির্দেশনা (Firebase Configuration & Setup Guide)

### ১. Firebase Project তৈরি করুন
১. [Firebase Console](https://console.firebase.google.com/)-এ যান।
২. **Add project** ক্লিক করে একটি নতুন প্রজেক্ট তৈরি করুন।

### ২. Authentication চালু করুন
১. বামের মেনু থেকে **Authentication** সেকশনে যান।
২. **Get Started** ক্লিক করুন।
৩. Sign-in method ট্যাব থেকে **Email/Password** এবং **Google** সাইন-ইন এনাবল (Enable) করুন।

### ৩. Firestore Database তৈরি করুন
১. বামের মেনু থেকে **Firestore Database**-এ যান।
২. **Create database** সিলেক্ট করুন এবং প্রোডাকশন মুড বা টেস্ট মুড সিলেক্ট করে ডাটাবেজ চালু করুন।

### ৪. Firebase Storage চালুকরণ
১. **Storage** অপশনে গিয়ে **Get Started** করুন এবং নিয়ম অনুযায়ী বাকেট তৈরি করুন।

### ৫. Firebase Configuration সেটআপ
প্রজেক্টের রুট ডিরেক্টরিতে `.env` অথবা `.env.example` ফাইল খুলুন এবং আপনার Firebase credentials বসান:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **নোট:** অ্যাপে `firebase-applet-config.json` ফাইল বিদ্যমান থাকলে তা স্বয়ংক্রিয়ভাবে প্রজেক্ট কনফিগারেশন গ্রহণ করবে।

---

## 💻 লোকালেই রান ও ডেভেলপমেন্ট

১. ডিপেন্ডেন্সি ইনস্টল করুন:
```bash
npm install
```

২. ডেভেলপমেন্ট সার্ভার চালু করুন:
```bash
npm run dev
```

৩. ব্রাউজারে `http://localhost:3000` ওপেন করুন।

---

## 📦 প্রজেক্ট বিল্ড ও মোতায়েন (Build & Firebase Deploy)

### প্রোডাকশন বিল্ড তৈরি করুন
```bash
npm run build
```

### Firebase Deploy কমান্ড
প্রজেক্টে আপনার ফায়ারবেস একাউন্ট কানেক্ট করে সিকিউরিটি রুলস ও হোস্টিং ডিপ্লয় করুন:

```bash
firebase login
firebase deploy
```

অথবা শুধু হোস্টিং / সিকিউরিটি রুল ডিপ্লয় করতে:
```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## 🔐 Security Rules Summary

* **Firestore Rules (`firestore.rules`):** কেবল সার্টিফাইড ব্যবহারকারীগণ তাদের নিজস্ব প্রোফাইল ও অনুমোদিত ম্যাসেজ/কল সিগন্যালিং অ্যাক্সেস করতে পারবে।
* **Storage Rules (`storage.rules`):** প্রোফাইল ছবি আপলোডের জন্য কেবল অথেন্টিকেটেড ব্যবহারকারীদের অনুমতি দেয়া হয়েছে।
