# CBODY Partner - UI Design System

## Overview
This document consolidates the common styles, themes, and UI patterns used across all CBODY Partner prototype pages. Use this as a reference when creating new pages to ensure consistency.

---

## Core Design Principles

### App Style
- Pure mobile app interface (375px x 812px)
- Rounded device shell (24px border-radius)
- Shadow-wrapped container for depth
- iOS-inspired status bar and safe areas

### Visual Style
- Clean, modern, professional aesthetic
- Generous white space and padding
- Rounded corners on all interactive elements
- Gradient accents for brand identity
- Shadow-based depth hierarchy

---

## Color System

### Primary Brand Colors
```css
/* Gradient Background - Primary brand identity */
.gradient-bg {
    background: linear-gradient(135deg, #39b59a, #46c5a7);
}

/* Gradient Text - For highlights and active states */
.gradient-text {
    background: linear-gradient(135deg, #39b59a, #46c5a7);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
```

### Neutral Colors
- **White**: `#ffffff` - Cards, backgrounds
- **Gray 50**: `#f9fafb` - Page background
- **Gray 100**: `#f3f4f6` - Secondary backgrounds, disabled states
- **Gray 200**: `#e5e7eb` - Borders
- **Gray 400**: `#9ca3af` - Inactive icons
- **Gray 500**: `#6b7280` - Secondary text
- **Gray 600**: `#4b5563` - Icons
- **Gray 700**: `#374151` - Body text
- **Gray 900**: `#111827` - Headings, primary text

### Status Colors
- **Success/Green**: `#10b981` (green-500)
- **Warning/Yellow**: `#f59e0b` (yellow-500)
- **Error/Red**: `#ef4444` (red-500)
- **Info/Blue**: `#3b82f6` (blue-500)

### Status Background Colors (Light variants)
- **Blue 50-100**: Info cards, system messages
- **Green 50-100**: Success states, completed orders
- **Yellow 50-100**: Pending states, warnings
- **Red 50-100**: Errors, cancellations, urgent actions

---

## Typography

### Font Family
```css
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

**Font CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Font Sizes & Weights
- **Headings (Page Title)**: `text-xl` (20px) or `text-2xl` (24px), `font-bold` (700)
- **Section Headers**: `text-lg` (18px), `font-semibold` (600)
- **Body Text**: `text-sm` (14px), `font-medium` (500) or `font-normal` (400)
- **Secondary Text**: `text-sm` (14px), `text-gray-500`
- **Labels/Captions**: `text-xs` (12px), `text-gray-500`

---

## Layout Structure

### Device Shell Container
```html
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
    <div class="w-[375px] device-container bg-white rounded-[24px] shadow-xl overflow-hidden relative">
        <!-- Content here -->
    </div>
</body>
```

```css
.device-container {
    height: 812px;
    max-height: 90vh;
}
```

### iOS Status Bar (Top)
```html
<div class="h-11 gradient-bg flex items-center justify-between px-6 text-white text-sm font-medium">
    <span>9:41</span>
    <div class="flex items-center space-x-1">
        <i class="fas fa-signal text-xs"></i>
        <i class="fas fa-wifi text-xs"></i>
        <i class="fas fa-battery-three-quarters text-xs"></i>
    </div>
</div>
```

### App Header
```html
<div class="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
    <h1 class="text-xl font-bold text-gray-900">Page Title</h1>
    <button class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <i class="fas fa-icon text-gray-600 text-sm"></i>
    </button>
</div>
```

**With Back Button:**
```html
<div class="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
    <a href="previous-page.html" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <i class="fas fa-arrow-left text-gray-600 text-sm"></i>
    </a>
    <h1 class="text-lg font-semibold text-gray-900">Page Title</h1>
    <button class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <i class="fas fa-icon text-gray-600 text-sm"></i>
    </button>
</div>
```

### Main Content Area
```html
<div class="flex-1 overflow-y-auto pb-20 scroll-container" style="height: calc(100% - 110px);">
    <!-- Page content here -->
</div>
```

```css
.scroll-container {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
}
```

### Bottom Tab Bar (Navigation)
```html
<div class="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-bottom">
    <div class="flex items-center">
        <a href="orders.html" class="flex-1 py-3 flex flex-col items-center space-y-1">
            <i class="fas fa-list-check text-lg text-gray-400"></i>
            <span class="text-xs font-medium text-gray-500">Orders</span>
        </a>
        <a href="messages.html" class="flex-1 py-3 flex flex-col items-center space-y-1">
            <i class="fas fa-comments text-lg text-gray-400"></i>
            <span class="text-xs font-medium text-gray-500">Messages</span>
        </a>
        <a href="me.html" class="flex-1 py-3 flex flex-col items-center space-y-1">
            <i class="fas fa-user text-lg gradient-text"></i>
            <span class="text-xs font-medium gradient-text">Me</span>
            <div class="w-6 h-0.5 gradient-bg rounded-full"></div>
        </a>
    </div>
</div>
```

**Active state:** Use `gradient-text` class and add indicator line below

```css
.safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom, 34px);
}
```

---

## Common Components

### Cards

**Basic Card:**
```html
<div class="bg-white p-4 rounded-2xl card-shadow">
    <!-- Card content -->
</div>
```

**Hoverable Card (with link):**
```html
<a href="detail-page.html" class="block">
    <div class="bg-white p-4 rounded-2xl card-shadow card-hover">
        <!-- Card content -->
    </div>
</a>
```

**Card Styles:**
```css
.card-shadow {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.card-hover {
    transition: all 0.3s ease;
}

.card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}
```

### Buttons

**Primary Button (Gradient):**
```html
<button class="w-full gradient-bg text-white py-4 rounded-2xl font-semibold">
    Button Text
</button>
```

**Secondary Button (Outline):**
```html
<button class="w-full py-4 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700">
    Button Text
</button>
```

**Icon Button:**
```html
<button class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center btn-clickable">
    <i class="fas fa-icon text-gray-600 text-sm"></i>
</button>
```

**Button Styles:**
```css
.btn-clickable {
    cursor: pointer !important;
    transition: all 0.2s ease;
}

.btn-clickable:hover {
    background-color: #f3f4f6 !important;
    transform: scale(1.05);
}

.btn-clickable * {
    pointer-events: none;
}
```

### Toast Notifications

```html
<div id="toast" class="absolute top-20 left-4 right-4 bg-green-500 text-white p-4 rounded-xl shadow-lg transform -translate-y-full opacity-0 transition-all duration-300">
    <div class="flex items-center space-x-3">
        <i class="fas fa-check-circle"></i>
        <span>Message here</span>
    </div>
</div>
```

**Toast JavaScript:**
```javascript
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.querySelector('span').textContent = message;
    toast.className = `absolute top-20 left-4 right-4 p-4 rounded-xl shadow-lg transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' :
        type === 'warning' ? 'bg-yellow-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    } text-white translate-y-0 opacity-100`;

    setTimeout(() => {
        toast.className = toast.className.replace('translate-y-0 opacity-100', '-translate-y-full opacity-0');
    }, 3000);
}
```

### Status Badges

```html
<!-- Pending -->
<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pending</span>

<!-- In Progress -->
<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">In Progress</span>

<!-- Completed -->
<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Completed</span>

<!-- Cancelled -->
<span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Cancelled</span>
```

### Segmented Control (Tabs)

```html
<div class="bg-gray-100 p-1 rounded-2xl flex">
    <button id="tab1" class="tab-button flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 active">
        <span>Tab 1</span>
    </button>
    <button id="tab2" class="tab-button flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200">
        <span>Tab 2</span>
    </button>
</div>
```

```css
.tab-button.active {
    background: white;
    color: #1f2937;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-button:not(.active) {
    background: transparent;
    color: #6b7280;
}
```

### Form Inputs

**Text Input:**
```html
<div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">Label</label>
    <input type="text"
           class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
           placeholder="Enter text">
</div>
```

**Password Input:**
```html
<div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
    <input type="password"
           class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
           placeholder="Enter password">
</div>
```

---

## Animations

### Fade In
```css
.fade-in {
    animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

### Spinner
```css
.spinner {
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

### Pulse (for notifications)
```css
.unread-dot {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## Icons

**Icon Library:** Font Awesome 6.4.0
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

**Common Icons:**
- Orders: `fa-list-check`
- Messages: `fa-comments`
- Profile/Me: `fa-user`
- Settings: `fa-cog`, `fa-user-cog`
- Calendar: `fa-calendar-days`
- Money/Income: `fa-sack-dollar`
- Phone: `fa-phone`
- Chat: `fa-comment`
- Map: `fa-map-marker-alt`, `fa-map-location-dot`
- Back: `fa-arrow-left`
- Check: `fa-check-circle`, `fa-check`
- Close: `fa-times`, `fa-times-circle`
- Info: `fa-info-circle`
- Emergency: `fa-exclamation-triangle`
- Support: `fa-headset`
- Search: `fa-search`

---

## Spacing System

Follow Tailwind's spacing scale:
- **Extra small gap**: `space-x-1`, `space-y-1` (0.25rem / 4px)
- **Small gap**: `space-x-2`, `space-y-2` (0.5rem / 8px)
- **Medium gap**: `space-x-3`, `space-y-3` (0.75rem / 12px)
- **Regular gap**: `space-x-4`, `space-y-4` (1rem / 16px)
- **Large gap**: `space-x-6`, `space-y-6` (1.5rem / 24px)

**Padding:**
- Cards: `p-4` (1rem / 16px)
- Sections: `p-6` (1.5rem / 24px)
- Container: `px-4` or `px-6`

---

## Required Dependencies

### CSS Framework
```html
<script src="https://cdn.tailwindcss.com"></script>
```

### Meta Tags
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Full Head Template
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - CBODY Partner</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .gradient-bg {
            background: linear-gradient(135deg, #39b59a, #46c5a7);
        }

        .gradient-text {
            background: linear-gradient(135deg, #39b59a, #46c5a7);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .card-shadow {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }

        .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 34px);
        }

        .card-hover {
            transition: all 0.3s ease;
        }

        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .scroll-container {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
        }

        .device-container {
            height: 812px;
            max-height: 90vh;
        }

        .btn-clickable {
            cursor: pointer !important;
            transition: all 0.2s ease;
        }

        .btn-clickable:hover {
            background-color: #f3f4f6 !important;
            transform: scale(1.05);
        }

        .btn-clickable * {
            pointer-events: none;
        }
    </style>
</head>
```

---

## Page Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Use Full Head Template above -->
</head>

<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
    <!-- Device Shell -->
    <div class="w-[375px] device-container bg-white rounded-[24px] shadow-xl overflow-hidden relative">

        <!-- iOS Status Bar -->
        <div class="h-11 gradient-bg flex items-center justify-between px-6 text-white text-sm font-medium">
            <span>9:41</span>
            <div class="flex items-center space-x-1">
                <i class="fas fa-signal text-xs"></i>
                <i class="fas fa-wifi text-xs"></i>
                <i class="fas fa-battery-three-quarters text-xs"></i>
            </div>
        </div>

        <!-- App Header -->
        <div class="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
            <h1 class="text-xl font-bold text-gray-900">Page Title</h1>
            <button class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <i class="fas fa-cog text-gray-600 text-sm"></i>
            </button>
        </div>

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto pb-20 scroll-container" style="height: calc(100% - 110px);">
            <!-- Your page content here -->
        </div>

        <!-- Optional: Bottom Tab Bar -->
        <div class="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-bottom">
            <div class="flex items-center">
                <a href="orders.html" class="flex-1 py-3 flex flex-col items-center space-y-1">
                    <i class="fas fa-list-check text-lg text-gray-400"></i>
                    <span class="text-xs font-medium text-gray-500">Orders</span>
                </a>
                <a href="messages.html" class="flex-1 py-3 flex flex-col items-center space-y-1">
                    <i class="fas fa-comments text-lg text-gray-400"></i>
                    <span class="text-xs font-medium text-gray-500">Messages</span>
                </a>
                <a href="me.html" class="flex-1 py-3 flex flex-col items-center space-y-1">
                    <i class="fas fa-user text-lg text-gray-400"></i>
                    <span class="text-xs font-medium text-gray-500">Me</span>
                </a>
            </div>
        </div>

        <!-- Toast Notification -->
        <div id="toast" class="absolute top-20 left-4 right-4 bg-green-500 text-white p-4 rounded-xl shadow-lg transform -translate-y-full opacity-0 transition-all duration-300">
            <div class="flex items-center space-x-3">
                <i class="fas fa-check-circle"></i>
                <span>Success message</span>
            </div>
        </div>
    </div>

    <script>
        // Add your JavaScript here
    </script>
</body>
</html>
```

---

## Best Practices

1. **Always use the device container** - All pages should be wrapped in the 375px device shell
2. **Include iOS status bar** - Maintain the gradient status bar at the top
3. **Use consistent spacing** - Follow Tailwind's spacing system
4. **Apply gradient to active states** - Use gradient-bg or gradient-text for selected items
5. **Add hover states** - Use card-hover and btn-clickable classes
6. **Use safe areas** - Apply safe-area-bottom to bottom navigation
7. **Maintain hierarchy** - Use proper heading levels and text sizes
8. **Keep it accessible** - Minimum touch target: 44x44px for buttons
9. **Toast feedback** - Show toast notifications for user actions
10. **Smooth scrolling** - Always add scroll-container class to scrollable areas

---

## Splash Screen Pattern

For initial loading or app entry:

```html
<div class="w-full h-full gradient-bg flex flex-col items-center justify-center">
    <!-- Logo -->
    <div class="fade-in mb-8">
        <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
            <i class="fas fa-briefcase text-3xl text-gray-700"></i>
        </div>
    </div>

    <!-- App Name -->
    <div class="fade-in mb-2" style="animation-delay: 0.3s;">
        <h1 class="text-white text-2xl font-bold">CBODY Partner</h1>
    </div>

    <!-- Tagline -->
    <div class="fade-in mb-12" style="animation-delay: 0.5s;">
        <p class="text-white/80 text-sm">Your wellness business companion</p>
    </div>

    <!-- Spinner -->
    <div class="fade-in" style="animation-delay: 0.8s;">
        <div class="spinner"></div>
    </div>

    <!-- Loading Text -->
    <div class="fade-in mt-6" style="animation-delay: 1s;">
        <p class="text-white/60 text-sm">Loading...</p>
    </div>
</div>
```

---

## Summary

This design system ensures:
- **Consistency**: All pages follow the same visual language
- **Efficiency**: Reusable components and patterns
- **Quality**: Professional, polished appearance
- **Scalability**: Easy to extend with new pages

When creating new pages, reference this document and existing pages to maintain consistency across the entire application.
