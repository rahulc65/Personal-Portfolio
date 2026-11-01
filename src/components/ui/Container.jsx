/**
 * Container
 * Shared max-width + responsive side padding used by the navbar and
 * every section, so the page edges line up everywhere.
 */
export default function Container({ children, className = '', as = 'div' }) {
  const Tag = as;
  return (
    <Tag className={`mx-auto w-full px-5 sm:px-8 lg:px-10 ${className}`}>
      {children}
    </Tag>
  );
}