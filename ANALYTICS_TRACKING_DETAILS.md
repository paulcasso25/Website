# Analytics Tracking Details - What Gets Tracked

## ✅ Enhanced Analytics Now Tracks:

### 1. **Time on Page** ⏱️
- **What:** Total time user spends on each page
- **How:** Tracks from page load until user leaves
- **Updates:** Every 5 seconds while page is visible
- **Pauses:** When user switches to another tab/window
- **Reports:** Final time when user leaves page

**Example Data:**
```json
{
  "timeOnPage": 127,  // seconds
  "page": "/catalogue-landscapes.html"
}
```

---

### 2. **Image Interactions** 🖼️

#### **Hover Tracking:**
- **What:** When user hovers over an image
- **Tracks:** 
  - How many times user hovers
  - Total time spent hovering
  - Which specific images

#### **Click Tracking:**
- **What:** When user clicks on an image
- **Tracks:**
  - Number of clicks per image
  - Which images are clicked most

#### **View Time:**
- **What:** How long images are visible on screen
- **Tracks:**
  - Total view time per image
  - Only counts views longer than 3 seconds
  - Tracks when image is 50%+ visible

**Example Data:**
```json
{
  "imageInteractions": [
    {
      "imageAlt": "The Old Bridge",
      "imageId": "20250607_152052.jpg",
      "totalViewTime": 45,  // seconds
      "hoverCount": 3,
      "clickCount": 1,
      "firstSeen": 1704067200000,
      "lastInteraction": 1704067245000
    },
    {
      "imageAlt": "The Falls",
      "imageId": "20241110_152900.jpg",
      "totalViewTime": 12,
      "hoverCount": 1,
      "clickCount": 0
    }
  ]
}
```

---

### 3. **Page Engagement** 📊

**Tracks:**
- Page views
- Time spent per page
- Which pages users spend most time on
- Navigation patterns

---

### 4. **Basic Visitor Info** 👤

**Tracks:**
- Screen size
- Browser language
- Timezone (for approximate location)
- Referrer (where they came from)
- Device type

---

## 📈 What You Can Analyze:

### **Most Popular Images:**
- Which artworks get the most views
- Which images users spend the most time viewing
- Which images get clicked most

### **Engagement Metrics:**
- Average time on each page
- Which pages keep users longest
- Image interaction rates

### **User Behavior:**
- Do users hover over images?
- Do they click through to details?
- How long do they view each artwork?

---

## 🔍 How to View the Data:

### **In Browser Console:**
1. Open your website
2. Accept cookies
3. Press F12 (Developer Tools)
4. Go to Console tab
5. Look for:
   - `"Analytics Event:"` - Page views and updates
   - `"Image Interaction:"` - Individual image interactions

### **Example Console Output:**
```
Analytics Event: {
  page: "/catalogue-landscapes.html",
  timeOnPage: 45,
  imageInteractions: [
    {
      imageAlt: "The Old Bridge",
      totalViewTime: 30,
      hoverCount: 2,
      clickCount: 1
    }
  ]
}

Image Interaction: {
  image: "The Old Bridge",
  event: "hover_end",
  viewTime: "30s",
  hoverCount: 2,
  clickCount: 1
}
```

---

## 🚀 To Send Data to Your Server:

1. **Set up an API endpoint** (Netlify Functions, AWS Lambda, etc.)
2. **Uncomment the fetch code** in `simple-analytics.js`
3. **Replace the URL** with your endpoint
4. **Store the data** in your database

**Example Endpoint Code (Node.js):**
```javascript
// Netlify Function example
exports.handler = async (event) => {
  const data = JSON.parse(event.body);
  
  // Store in database
  await db.analytics.insert({
    page: data.page,
    timeOnPage: data.timeOnPage,
    imageInteractions: data.imageInteractions,
    timestamp: new Date()
  });
  
  return { statusCode: 200, body: 'OK' };
};
```

---

## 📊 Data Structure:

### **Page View Event:**
```json
{
  "event": "pageview",
  "page": "/catalogue-landscapes.html",
  "timeOnPage": 0,
  "referrer": "https://google.com",
  "screenWidth": 1920,
  "screenHeight": 1080,
  "language": "en-US",
  "timezone": "America/New_York",
  "estimatedRegion": "United States",
  "imageInteractions": []
}
```

### **Page Update Event (every 30 seconds):**
```json
{
  "event": "page_update",
  "page": "/catalogue-landscapes.html",
  "timeOnPage": 127,
  "imageInteractions": [
    {
      "imageAlt": "The Old Bridge",
      "imageId": "20250607_152052.jpg",
      "totalViewTime": 45,
      "hoverCount": 3,
      "clickCount": 1
    }
  ]
}
```

### **Page Exit Event:**
```json
{
  "event": "page_exit",
  "page": "/catalogue-landscapes.html",
  "timeOnPage": 245,
  "imageInteractions": [...]
}
```

---

## 🔒 Privacy:

- ✅ Only tracks when user accepts cookies
- ✅ No personal information collected
- ✅ No IP addresses stored
- ✅ No cross-site tracking
- ✅ All data is anonymous
- ✅ User can decline and no tracking occurs

---

## 💡 Use Cases:

### **For Art Gallery:**
- **Most Popular Artworks:** See which paintings get most attention
- **Engagement Time:** Which artworks users spend most time viewing
- **Click-Through Rate:** Which images lead to inquiries
- **Page Performance:** Which pages keep visitors longest

### **Business Insights:**
- Focus marketing on popular artworks
- Understand visitor preferences
- Optimize page layout based on engagement
- Identify which artworks generate interest

---

## 🛠️ Customization:

You can modify `simple-analytics.js` to:
- Change tracking intervals
- Add custom events
- Track specific user actions
- Filter which images to track
- Adjust view time thresholds

---

**Note:** All tracking respects user privacy and only occurs when cookies are accepted. Data is logged to console by default, but can be sent to your own server for storage and analysis.

