import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'poppins': ['Poppins', 'sans-serif'],
			},
			colors: {
				border: {
					DEFAULT: 'hsl(var(--border))',
					strong: 'hsl(var(--border-strong))'
				},
				input: {
					DEFAULT: 'hsl(var(--input))',
					bg: 'hsl(var(--input-bg))',
					border: 'hsl(var(--input-border))',
					'border-hover': 'hsl(var(--input-border-hover))',
					placeholder: 'hsl(var(--input-placeholder))'
				},
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				/* Elevation ladder — see index.css for the lightness steps */
				surface: {
					DEFAULT: 'hsl(var(--surface-1))',
					1: 'hsl(var(--surface-1))',
					2: 'hsl(var(--surface-2))',
					3: 'hsl(var(--surface-3))'
				},
				subtle: 'hsl(var(--text-subtle))',
				header: {
					DEFAULT: 'hsl(var(--header-bg))',
					border: 'hsl(var(--header-border))'
				},
				/* The sidebar rail is its own context in both themes (dark navy in
				 * light mode too), so elements on it use these, not app surfaces. */
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-bg))',
					border: 'hsl(var(--sidebar-border))',
					hover: 'hsl(var(--sidebar-item-hover))',
					active: 'hsl(var(--sidebar-item-active))',
					foreground: 'hsl(var(--sidebar-text))',
					'foreground-hover': 'hsl(var(--sidebar-text-hover))',
					'foreground-active': 'hsl(var(--sidebar-text-active))'
				},
				table: {
					header: 'hsl(var(--table-header-bg))',
					'header-foreground': 'hsl(var(--table-header-foreground))',
					hover: 'hsl(var(--table-row-hover))',
					selected: 'hsl(var(--table-row-selected))',
					border: 'hsl(var(--table-border))'
				},
				selected: {
					DEFAULT: 'hsl(var(--selected-bg))',
					foreground: 'hsl(var(--selected-foreground))'
				},
				modal: {
					DEFAULT: 'hsl(var(--modal))',
					foreground: 'hsl(var(--modal-foreground))'
				},
				overlay: 'hsl(var(--overlay))',
				scrim: 'hsl(var(--scrim))',
				/* Named `cta`, not `solid` — a `solid` color key would emit a
				 * `border-solid` class that collides with Tailwind's
				 * border-style utility of the same name. */
				cta: {
					DEFAULT: 'hsl(var(--btn-solid))',
					foreground: 'hsl(var(--btn-solid-foreground))',
					border: 'hsl(var(--btn-solid-border))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					soft: 'hsl(var(--success-soft))',
					border: 'hsl(var(--success-border))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					soft: 'hsl(var(--warning-soft))',
					border: 'hsl(var(--warning-border))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))',
					soft: 'hsl(var(--info-soft))',
					border: 'hsl(var(--info-border))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
					active: 'hsl(var(--primary-active))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))',
					active: 'hsl(var(--secondary-active))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					soft: 'hsl(var(--destructive-soft))',
					border: 'hsl(var(--destructive-border))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				glass: {
					DEFAULT: 'hsl(var(--glass-bg))',
					border: 'hsl(var(--glass-border))',
					hover: 'hsl(var(--glass-hover))'
				},
				deal: {
					DEFAULT: 'hsl(var(--deal-accent))',
					foreground: 'hsl(var(--deal-accent-foreground))',
					glass: 'hsl(var(--deal-glass-bg))',
					'glass-border': 'hsl(var(--deal-glass-border))',
					'glass-hover': 'hsl(var(--deal-glass-hover))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-dark': 'var(--gradient-dark)', 
				'gradient-glass': 'var(--gradient-glass)',
				'gradient-deal': 'var(--gradient-deal)'
			},
			boxShadow: {
				'glow': 'var(--glow-primary)',
				'glow-accent': 'var(--glow-accent)',
				'elevation-sm': 'var(--shadow-sm)',
				'elevation-md': 'var(--shadow-md)',
				'elevation-lg': 'var(--shadow-lg)',
				'elevation-xl': 'var(--shadow-xl)'
			},
			backdropBlur: {
				xs: '2px'
			},
			/* One radius scale for the whole app, driven by --radius (8px).
			 *   sm  4px — inline chips, checkboxes, menu items
			 *   md  6px — buttons, inputs, selects  (the default control radius)
			 *   lg  8px — cards, panels, list rows
			 *   xl 12px — modals, sheets, large surfaces
			 *   full   — avatars, pills, status dots ONLY
			 * Nothing should introduce an arbitrary radius outside this scale. */
			borderRadius: {
				sm: 'calc(var(--radius) - 4px)',
				md: 'calc(var(--radius) - 2px)',
				lg: 'var(--radius)',
				xl: 'calc(var(--radius) + 4px)',
				'2xl': 'calc(var(--radius) + 8px)'
			},
			transitionDuration: {
				fast: 'var(--duration-fast)',
				base: 'var(--duration-base)',
				slow: 'var(--duration-slow)'
			},
			transitionTimingFunction: {
				standard: 'var(--ease-standard)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
