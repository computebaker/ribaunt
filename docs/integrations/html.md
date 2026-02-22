# Plain HTML & Vanilla JS Integration

You don't need a framework to use Ribaunt CAPTCHA. The widget is a standard Web Component (`<ribaunt-widget>`) that works natively in any modern browser.

## 1. Import the Widget

You can load the script as an ES module directly in your HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Secure Form</title>
    <!-- Adjust the path based on your static file hosting -->
    <script type="module" src="/path/to/ribaunt/dist/widget-browser.js"></script>
</head>
<body>
    <form id="secure-form" action="/api/submit" method="POST">
        <h2>Please verify you are human</h2>
        
        <ribaunt-widget 
            id="captcha"
            challenge-endpoint="/api/captcha/challenge"
            verify-endpoint="/api/captcha/verify"
        ></ribaunt-widget>

        <!-- Keep disabled until verified -->
        <button type="submit" id="submit-btn" disabled>Submit Data</button>
    </form>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const widget = document.getElementById('captcha');
            const submitBtn = document.getElementById('submit-btn');

            // Listen for successful verification
            widget.addEventListener('verify', (e) => {
                console.log('User verified!', e.detail.solutions);
                submitBtn.disabled = false; // Enable submission
            });

            // Listen for errors
            widget.addEventListener('error', (e) => {
                console.error('CAPTCHA Failed:', e.detail.error);
                submitBtn.disabled = true;
            });
            
            // Listen for state changes (optional)
            widget.addEventListener('state-change', (e) => {
                console.log('Widget is now in state:', e.detail.state);
            });
        });
    </script>
</body>
</html>
```

## Styling

Since it's a web component, internal elements are protected by the Shadow DOM. However, you can style the container or use CSS custom properties to customize the internal appearance.

```css
#captcha {
  /* Override global variables for just this widget */
  --ribaunt-background: #f0f0f0;
  --ribaunt-border-color: #ccc;
  
  /* Standard CSS works on the host element */
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```
