import type { ButtonHTMLAttributes } from 'react';

/**
 * Themed button. All visual styling comes from the design tokens in
 * `globals.css` (`.button` and its variants), so every button across the app
 * stays on-theme.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Stretch to the full width of the container. */
  block?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'button',
  secondary: 'button button-secondary',
  ghost: 'button button-ghost',
};

export function Button({
  variant = 'primary',
  block = false,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps): JSX.Element {
  const classes = [VARIANT_CLASS[variant], block ? 'button-block' : '', className]
    .filter(Boolean)
    .join(' ');

  // eslint-disable-next-line react/button-has-type -- `type` defaults to "button" above.
  return <button type={type} className={classes} {...rest} />;
}
