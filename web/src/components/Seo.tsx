// SEO meta tags via react-helmet-async.
import { Helmet } from "react-helmet-async";

interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
}

const SITE = import.meta.env.VITE_SITE_NAME || "B.Tech eKart";

export default function Seo({
  title,
  description,
  image,
  type = "website",
  noindex,
}: Props) {
  const fullTitle = title.includes(SITE) ? title : `${title} | ${SITE}`;
  const desc =
    description ||
    "Buy AKTU B.Tech Notes, PYQs, Quantums, Syllabus and Combo packs. Instant digital download for CSE, IT, ECE, ME, CE, EE students.";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
    </Helmet>
  );
}
