import { Link } from "react-router-dom";
import { Bookmark, ArrowUpRight } from "lucide-react";
export const categories = [
  ["all", "Everything"],
  ["plan", "Training plans"],
  ["coaching", "Coaching"],
  ["meal", "Meals"],
  ["supplement", "Supplements"],
  ["gear", "Gear"],
];
export type Listing = {
  _id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  features: string[];
  priceMinor: number;
  currency: string;
  billing: string;
  duration: string;
  isDemo: boolean;
  status?: string;
  sellerLicenceRef?: string;
  reviewNote?: string;
  providerId: { _id: string; name: string; roles?: string[] };
};
export const money = (minor: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: minor % 100 ? 2 : 0,
  }).format(minor / 100);
export function ListingCover({ listing }: { listing: Listing }) {
  return (
    <div
      className={`listing-cover cover-${listing.category}`}
      aria-hidden="true"
    >
      {listing.category === "coaching" ? (
        <>
          <span className="provider-initials">
            {listing.providerId?.name
              ?.split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="cover-caption">A human in your corner.</span>
        </>
      ) : (
        <div className="programme-cover">
          <span>fitplatform.</span>
          <strong>{listing.title}</strong>
          <small>
            {listing.duration ||
              categories.find(([key]) => key === listing.category)?.[1]}
          </small>
        </div>
      )}
    </div>
  );
}
export function ListingCard({
  listing,
  saved,
  onSave,
}: {
  listing: Listing;
  saved: boolean;
  onSave?: (listing: Listing) => void;
}) {
  return (
    <article className="listing-card">
      <Link
        to={`/marketplace/${listing.slug}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ListingCover listing={listing} />
      </Link>
      <div className="listing-card-copy">
        <div className="section-row">
          <Link
            className="listing-card-title"
            to={`/marketplace/${listing.slug}`}
          >
            {listing.title}
            <ArrowUpRight size={16} />
          </Link>
          {onSave && (
            <button
              className="icon-control"
              aria-label={
                saved ? `Unsave ${listing.title}` : `Save ${listing.title}`
              }
              aria-pressed={saved}
              onClick={() => onSave?.(listing)}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        <p className="listing-provider">
          By {listing.providerId?.name || "Platform provider"}
          {listing.isDemo && <span>Demo listing</span>}
        </p>
        <p className="listing-summary">{listing.summary}</p>
        <div className="listing-price">
          <strong>
            {money(listing.priceMinor, listing.currency)}
            {listing.billing === "month" && <small> / month</small>}
          </strong>
          <span>{listing.duration}</span>
        </div>
      </div>
    </article>
  );
}
