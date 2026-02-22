# Theming & Customization

Ribaunt CAPTCHA is fully customizable using CSS custom properties (variables). You can override them globally or scope them specifically to the widget.

## CSS Custom Properties Reference

| Variable | Description | Default Value |
|---|---|---|
| `--ribaunt-background` | Widget container background | `#fdfdfd` |
| `--ribaunt-border-color` | Widget border color | `#dddddd8f` |
| `--ribaunt-border-radius` | Widget border radius | `14px` |
| `--ribaunt-color` | Text color | `#212121` |
| `--ribaunt-widget-width` | Widget width | `230px` |
| `--ribaunt-widget-height` | Widget height | `58px` |
| `--ribaunt-checkbox-background` | Checkbox background color | `#fafafa91` |
| `--ribaunt-checkbox-border` | Checkbox border | `1px solid #aaaaaad1` |
| `--ribaunt-spinner-color` | Active spinner segment color | `#000` |
| `--ribaunt-spinner-background-color` | Inactive spinner track color | `#eee` |
| `--ribaunt-logo-color` | Color of the Ribaunt logo | `#666` |
| `--ribaunt-font` | Font stack | system sans-serif |

## Implementing Dark Mode

Ribaunt does not enforce an automatic dark mode; instead, you can bind dark mode via media queries or specific CSS classes like `.dark`.

### Example: Media Query

```css
@media (prefers-color-scheme: dark) {
  ribaunt-widget {
    --ribaunt-background: #2d2d2d;
    --ribaunt-border-color: #555;
    --ribaunt-color: #ffffff;
    --ribaunt-checkbox-background: #444;
    --ribaunt-spinner-color: #ffffff;
    --ribaunt-spinner-background-color: #333;
    --ribaunt-logo-color: #cccccc;
  }
}
```

### Example: CSS Class

```css
.dark ribaunt-widget {
  --ribaunt-background: #111;
  --ribaunt-color: #eee;
  /* ... */
}
```

## Changing Dimensions

To make the widget fit your specific form design:

```css
ribaunt-widget.large {
  --ribaunt-widget-width: 300px;
  --ribaunt-widget-height: 72px;
  --ribaunt-checkbox-size: 32px;
}
```
