import Link from 'next/link';

const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
  return (
    <p className="auth-footer">
      {text}{' '}
      <Link href={href} className="footer-link">
        {linkText}
      </Link>
    </p>
  );
};

export default FooterLink;
