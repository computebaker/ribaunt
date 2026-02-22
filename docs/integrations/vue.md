# Vue.js Integration Guide

Integrating Ribaunt CAPTCHA into a Vue 3 project is extremely straightforward since Vue natively understands Web Components.

## Registration

To use the widget without Vue warning about an "Unknown custom element", you must register it in your `vite.config.ts` or `vue.config.js`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Tell Vue that all tags starting with 'ribaunt-' are custom elements
          isCustomElement: (tag) => tag.startsWith('ribaunt-')
        }
      }
    })
  ]
})
```

## Using in a Component

Then, simply import the widget as a side-effect and use the `<ribaunt-widget>` tag directly in your templates. Use Vue's `@` syntax for event listeners and `:` syntax for bound properties.

```vue
<template>
  <form @submit.prevent="submitForm">
    <ribaunt-widget
      ref="widgetRef"
      challenge-endpoint="/api/captcha/challenge"
      verify-endpoint="/api/captcha/verify"
      :show-warning="showWarning"
      @verify="onVerify"
      @error="onError"
      @state-change="onStateChange"
    ></ribaunt-widget>

    <button type="submit" :disabled="!isVerified">Submit Form</button>
    <button type="button" @click="resetCaptcha">Reset</button>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RibauntWidgetElement, WidgetState } from 'ribaunt/widget'

// Register the web component
import 'ribaunt/widget'

const widgetRef = ref<RibauntWidgetElement | null>(null)
const isVerified = ref(false)
const showWarning = ref(false)

const onVerify = (event: CustomEvent<{ solutions: any[] }>) => {
  console.log('Verified!', event.detail.solutions)
  isVerified.value = true
}

const onError = (event: CustomEvent<{ error: string }>) => {
  console.error('Error verifying:', event.detail.error)
  isVerified.value = false
}

const onStateChange = (event: CustomEvent<{ state: WidgetState }>) => {
  console.log('State changed to:', event.detail.state)
}

const resetCaptcha = () => {
  if (widgetRef.value) {
    widgetRef.value.reset()
    isVerified.value = false
  }
}

const submitForm = () => {
  if (isVerified.value) {
    // Proceed with form submission
    console.log('Form submitted securely!')
  }
}
</script>
```

Since Vue correctly passes properties down, everything is reactive!
