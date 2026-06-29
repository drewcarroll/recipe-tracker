import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

/**
 * Themed surface (`.card` token in `globals.css`). Polymorphic via `as` so it
 * can render as a `div` (default), a `form` (e.g. the login screen), etc.
 */

type CardProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

export function Card<T extends ElementType = 'div'>({
  as,
  className = '',
  children,
  ...rest
}: CardProps<T>): JSX.Element {
  const Tag = (as ?? 'div') as ElementType;
  const classes = ['card', className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
