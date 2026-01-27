import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--color-background)',
                foreground: 'var(--color-foreground)',
                card: {
                    DEFAULT: 'var(--color-card)',
                    foreground: 'var(--color-card-foreground)',
                },
                popover: {
                    DEFAULT: 'var(--color-popover)',
                    foreground: 'var(--color-popover-foreground)',
                },
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    foreground: 'var(--color-primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--color-secondary)',
                    foreground: 'var(--color-secondary-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--color-muted)',
                    foreground: 'var(--color-muted-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    foreground: 'var(--color-accent-foreground)',
                },
                destructive: {
                    DEFAULT: 'var(--color-destructive)',
                    foreground: 'var(--color-destructive-foreground)',
                },
                border: 'var(--color-border)',
                input: 'var(--color-input)',
                ring: 'var(--color-ring)',
            },
            borderRadius: {
                lg: '0.5rem',
                md: '0.375rem',
                sm: '0.25rem',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};

export default config;
