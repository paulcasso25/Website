# SEO Setup Guide for PAUL CASSO Art Gallery

This guide outlines the SEO optimizations that have been implemented and what needs to be updated when the site goes live with your actual domain.

## ✅ What Has Been Implemented

### 1. Meta Tags Added to All HTML Pages
All pages now include:
- **Primary Meta Tags**: title, description, keywords, author, robots
- **Open Graph Tags**: For Facebook and social media sharing
- **Twitter Card Tags**: For Twitter sharing
- **Canonical URLs**: To prevent duplicate content issues

**Pages Updated:**
- `index.html` - Welcome page
- `Home.html` - Gallery main page
- `bio.html` - Artist biography
- `catalogue-landscapes.html` - Landscapes collection
- `catalogue-perspectives.html` - Perspectives collection

### 2. Structured Data (JSON-LD)
Added Schema.org structured data to help Google understand your content:
- **WebSite** schema on index page
- **Person** schema for artist information
- **ItemList** schema for art collections
- **VisualArtwork** schema for individual artworks

### 3. Sitemap Created
- `sitemap.xml` - Lists all pages with priorities and update frequencies
- Location: Root directory

### 4. Robots.txt Created
- `robots.txt` - Tells search engines how to crawl your site
- Location: Root directory

---

## 🔧 Required Updates When Site Goes Live

### 1. Replace Domain Placeholder

**Find and Replace:** `https://yourdomain.com/` with your actual domain (e.g., `https://paulcasso.art/`)

**Files to Update:**
- `index.html` - All meta tags (lines 15, 19, 27, 38, 46)
- `Home.html` - All meta tags (lines 15, 19, 27, 39)
- `bio.html` - All meta tags (lines 15, 19, 29, 43)
- `catalogue-landscapes.html` - All meta tags (lines 15, 19, 27, 39)
- `catalogue-perspectives.html` - All meta tags (lines 15, 19, 27, 39)
- `sitemap.xml` - All URLs (lines 4, 8, 12, 16, 20, 24)
- `robots.txt` - Sitemap URL (line 3)

### 2. Update Last Modified Dates in Sitemap

In `sitemap.xml`, update the `<lastmod>` dates to the current date when going live (format: YYYY-MM-DD).

### 3. Add Social Media Profiles (Optional)

In the structured data, you can add social media profiles to the `sameAs` array:

**Example:**
```json
"sameAs": [
  "https://www.facebook.com/yourprofile",
  "https://twitter.com/yourprofile",
  "https://instagram.com/yourprofile"
]
```

Files to update: `index.html`, `bio.html`

### 4. Add Google Analytics (Optional but Recommended)

Add this code before the closing `</head>` tag in all HTML files:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 5. Submit to Google Search Console

Once your site is live:
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (your domain)
3. Verify ownership
4. Submit your `sitemap.xml` file

### 6. Submit to Bing Webmaster Tools (Optional)

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site
3. Submit your sitemap

---

## 📊 SEO Features Implemented

### Meta Tags
- ✅ Descriptive titles for all pages
- ✅ Unique meta descriptions (150-160 characters)
- ✅ Relevant keywords
- ✅ Author attribution
- ✅ Canonical URLs

### Open Graph (Facebook)
- ✅ og:type, og:url, og:title, og:description
- ✅ og:image for social sharing
- ✅ og:site_name

### Twitter Cards
- ✅ twitter:card set to "summary_large_image"
- ✅ twitter:title, twitter:description, twitter:image
- ✅ twitter:url

### Structured Data (Schema.org)
- ✅ WebSite schema
- ✅ Person schema
- ✅ ItemList schema
- ✅ VisualArtwork schema

### Technical SEO
- ✅ Sitemap.xml
- ✅ Robots.txt
- ✅ Canonical URLs
- ✅ UTF-8 encoding
- ✅ Viewport meta tag for mobile

---

## 🎯 Next Steps

1. **Get your domain name**
2. **Replace all instances of `yourdomain.com`** in the files listed above
3. **Update the `<lastmod>` dates** in sitemap.xml
4. **Upload files to your hosting**
5. **Submit sitemap to Google Search Console**
6. **Monitor performance** using Google Search Console and Analytics

---

## 📝 Notes

- All images are currently hosted on GitHub. Consider moving to a CDN for better performance.
- The site is already mobile-friendly with the viewport meta tag.
- Alt text has been added to images for better accessibility and SEO.
- The site uses semantic HTML which helps with SEO.

---

## 🔍 Testing Your SEO

After going live, test your implementation:

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Enter your URL to validate structured data

2. **Google Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly
   - Ensure mobile usability

3. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
   - Test Open Graph tags

4. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Test Twitter Card tags

5. **Schema.org Validator**: https://validator.schema.org/
   - Validate structured data

---

## 📧 Questions?

If you need any adjustments or have questions about the SEO setup, refer to this guide or contact your developer.

