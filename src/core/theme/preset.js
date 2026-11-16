import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/** Preset Aura yang disesuaikan dengan token Bank Provita (biru laut, radius 12px). */
export const ProvitaPreset = definePreset(Aura, {
  primitive: {
    borderRadius: { none: '0', xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
  },
  semantic: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    focusRing: { width: '2px', style: 'solid', color: '{primary.700}', offset: '2px' },
    formField: {
      paddingX: '0.875rem',
      paddingY: '0.625rem',
      borderRadius: '{border.radius.md}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.700}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.900}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.800}',
          focusColor: '{primary.900}',
        },
        formField: {
          borderColor: '#cbd5e1',
          hoverBorderColor: '#94a3b8',
          focusBorderColor: '{primary.700}',
          placeholderColor: '#94a3b8',
          color: '#0f172a',
        },
        text: { color: '#0f172a', mutedColor: '#64748b' },
      },
    },
  },
  components: {
    button: {
      root: { borderRadius: '{border.radius.md}', paddingY: '0.625rem', paddingX: '1.25rem' },
    },
    card: { root: { borderRadius: '16px' } },
    dialog: { root: { borderRadius: '24px' } },
    datatable: {
      headerCell: { padding: '0.875rem 1rem' },
      bodyCell: { padding: '1rem' },
    },
  },
})
