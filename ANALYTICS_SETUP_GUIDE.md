# Analytics Setup Guide for PAUL CASSO Art Gallery

This guide explains the open-source analytics options available for tracking visitor behavior and location.

## 📊 Current Implementation

Your website now includes **two analytics options** that only load when users accept cookies:

1. **Simple Custom Analytics** (Active by default)
2. **Plausible Analytics** (Ready to activate - requires signup)

---

## 🎯 Option 1: Plausible Analytics (Recommended)

### Why Plausible?
- ✅ **100% Open Source** - Full source code available
- ✅ **Privacy-Focused** - No cookies, GDPR compliant
- ✅ **Country-Level Location** - Shows visitor countries
- ✅ **Lightweight** - Only 1KB script
- ✅ **Beautiful Dashboard** - Easy to use interface
- ✅ **Free Tier Available** - Up to 10,000 pageviews/month free

### What It Tracks:
- Page views
- Visitor countries (location)
- Referrers (where visitors came from)
- Devices (desktop, mobile, tablet)
- Browsers
- Screen sizes
- Time on site

### Setup Instructions:

1. **Sign up for Plausible:**
   - Go to https://plausible.io/
   - Click "Start free trial"
   - Create an account

2. **Add your website:**
   - In your Plausible dashboard, click "Add website"
   - Enter: `paulcasso-website.netlify.app`
   - Copy your domain

3. **Activate in your code:**
   - Open `index.html`, `Home.html`, `bio.html`, `catalogue-landscapes.html`, `catalogue-perspectives.html`
   - Find the `loadAnalytics()` function
   - Uncomment the Plausible code block (remove `/*` and `*/`)
   - Comment out the Simple Analytics line
   - The domain is already set to `paulcasso-website.netlify.app`

4. **Verify it's working:**
   - Visit your website
   - Accept cookies
   - Check your Plausible dashboard (may take a few minutes to appear)

### Example Code (already in your files):
```javascript
// Uncomment this block in loadAnalytics() function:
const script = document.createElement('script');
script.defer = true;
script.dataset.domain = 'paulcasso-website.netlify.app';
script.src = 'https://plausible.io/js/script.js';
document.head.appendChild(script);
```

---

## 🔧 Option 2: Simple Custom Analytics (Currently Active)

### What It Does:
- ✅ **Works Immediately** - No signup required
- ✅ **Privacy-Friendly** - Logs to browser console
- ✅ **Tracks Basic Data:**
  - Page views
  - Referrer (where visitors came from)
  - Screen size
  - Browser language
  - Timezone (for approximate location)
  - Device type

### Current Behavior:
- Logs analytics data to browser console
- Only tracks when users accept cookies
- Can be extended to send data to your own endpoint

### To View Data:
1. Open your website
2. Accept cookies
3. Open browser Developer Tools (F12)
4. Go to Console tab
5. Look for "Analytics Event:" and "Page View:" messages

### To Send Data to Your Own Server:
1. Set up an API endpoint (e.g., using Netlify Functions, AWS Lambda, etc.)
2. Open `simple-analytics.js`
3. Uncomment the `fetch()` code block
4. Replace `'https://your-analytics-endpoint.com/track'` with your endpoint URL
5. Configure your server to receive and store the data

---

## 🌍 Option 3: Umami Analytics (Self-Hosted)

### Why Umami?
- ✅ **100% Open Source** - Self-hosted, full control
- ✅ **Privacy-Focused** - No cookies, GDPR compliant
- ✅ **Free Forever** - No limits
- ✅ **Country-Level Location**
- ✅ **Requires Server** - Need to host it yourself

### Setup:
1. Deploy Umami to a server (VPS, Railway, Render, etc.)
2. Follow: https://umami.is/docs/install
3. Get your website ID
4. Update `analytics.js` with your Umami instance URL

---

## 📈 Option 4: Matomo Analytics (Self-Hosted)

### Why Matomo?
- ✅ **Most Features** - Full-featured analytics
- ✅ **100% Open Source**
- ✅ **Self-Hosted** - Complete data ownership
- ✅ **Country & City Location**
- ✅ **Requires Server** - More complex setup

### Setup:
1. Install Matomo on your server
2. Create a website in Matomo dashboard
3. Get your site ID
4. Update `analytics.js` with your Matomo instance URL

---

## 🔒 Privacy & GDPR Compliance

All analytics options:
- ✅ Only load when users **explicitly accept cookies**
- ✅ Respect user choice (decline = no tracking)
- ✅ GDPR compliant
- ✅ No personal data collection
- ✅ Country-level location only (not precise)

---

## 📊 What Data You'll See

### Plausible Dashboard Shows:
- **Visitors** - Unique visitors per day/week/month
- **Page Views** - Total page views
- **Top Pages** - Most visited pages
- **Countries** - Visitor locations by country
- **Referrers** - Where visitors came from
- **Devices** - Desktop vs Mobile vs Tablet
- **Browsers** - Chrome, Safari, Firefox, etc.
- **Screen Sizes** - Most common screen resolutions

### Simple Analytics Shows (in console):
- Page path
- Referrer
- Screen dimensions
- Language
- Timezone/Region
- Timestamp

---

## 🚀 Quick Start (Recommended Path)

1. **Start with Simple Analytics** (already active)
   - View data in browser console
   - Test that cookie consent works

2. **Upgrade to Plausible** (when ready)
   - Sign up at plausible.io
   - Uncomment Plausible code
   - Get beautiful dashboard with country data

3. **Optional: Self-Host Umami** (if you want full control)
   - Deploy to your own server
   - Complete data ownership

---

## 🛠️ Troubleshooting

### Analytics not loading?
- Check that user accepted cookies
- Open browser console (F12) for errors
- Verify script paths are correct

### Plausible not showing data?
- Wait 5-10 minutes for first data
- Verify domain is correct in code
- Check Plausible dashboard for setup status

### Want to switch analytics?
- Comment out current option
- Uncomment desired option
- Update configuration as needed

---

## 📝 Files Modified

- `index.html` - Added analytics loading function
- `Home.html` - Added analytics loading function
- `bio.html` - Added analytics loading function
- `catalogue-landscapes.html` - Added analytics loading function
- `catalogue-perspectives.html` - Added analytics loading function
- `simple-analytics.js` - Simple custom analytics script
- `analytics.js` - Alternative analytics options (reference)

---

## 🎯 Next Steps

1. **Test Simple Analytics:**
   - Visit your site
   - Accept cookies
   - Check browser console for analytics logs

2. **Set up Plausible (Recommended):**
   - Sign up at plausible.io
   - Add your domain
   - Uncomment Plausible code in your HTML files
   - Start tracking with a beautiful dashboard!

3. **Optional: Customize:**
   - Modify `simple-analytics.js` to send data to your endpoint
   - Add custom event tracking
   - Integrate with other tools

---

## 📚 Resources

- **Plausible:** https://plausible.io/
- **Umami:** https://umami.is/
- **Matomo:** https://matomo.org/
- **Plausible Docs:** https://plausible.io/docs

---

**Note:** All analytics respect user privacy and only load when cookies are accepted. No tracking occurs if users decline cookies.

