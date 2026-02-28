# Theming System

The storefront uses a dual-layer theming approach: **shadcn/ui** as the component library for new UI, and **@medusajs/ui** kept in place for existing admin/B2B components — both driven by the same CSS variables.

---

## Architecture

```
globals.css
  ├── :root        → light mode CSS vars (oklch silk/gold palette)
  ├── .dark        → dark mode overrides
  └── Bridge vars  → maps @medusajs/ui-preset internals to our palette
```

No `@medusajs/ui` component files were replaced. The bridge in `globals.css` overrides the CSS vars that `@medusajs/ui-preset` injects at build time, so all existing components automatically render in the silk/gold theme.

---

## Palette

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | warm off-white | deep charcoal | Page background |
| `--primary` | silk gold | bright gold | CTAs, accents |
| `--foreground` | dark warm gray | light cream | Body text |
| `--muted` | light sand | dark muted | Subtle backgrounds |
| `--border` | warm gray | muted dark | Dividers, inputs |

All colors use **oklch** for perceptual uniformity and vivid saturation.

---

## Files

| File | Role |
|---|---|
| `storefront/src/styles/globals.css` | All CSS variables — edit here to retheme |
| `storefront/tailwind.config.js` | Tailwind config — keeps `@medusajs/ui-preset`, adds shadcn color extensions |
| `storefront/components.json` | shadcn/ui config (new-york style, `@/components/ui` path) |
| `storefront/src/components/ui/` | 27 shadcn/ui components |
| `storefront/src/components/theme-provider.tsx` | `next-themes` ThemeProvider wrapper |
| `storefront/src/lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |

---

## Adding a New shadcn Component

```bash
cd storefront
npx shadcn@latest add <component-name>
```

Components land in `storefront/src/components/ui/` and automatically pick up the theme.

---

## Customising the Palette

Edit the CSS variables in `storefront/src/styles/globals.css`:

```css
:root {
  --primary: oklch(0.72 0.15 85);      /* change hue/chroma/lightness */
  --primary-foreground: oklch(0.15 0.02 85);
}
.dark {
  --primary: oklch(0.78 0.17 85);
}
```

The `@medusajs/ui` bridge vars (`--bg-base`, `--fg-base`, `--button-*`, etc.) sit below the shadcn vars in the same file — update them to keep the two systems in sync.

---

## Dark Mode

Dark mode is handled by `next-themes`. The `ThemeProvider` is in `storefront/src/app/layout.tsx`. The `ThemeToggle` component is at `storefront/src/components/theme-toggle.tsx`.
