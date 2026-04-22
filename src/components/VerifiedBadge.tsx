import { BadgeCheck } from "lucide-react";

interface Props {
  verified?: boolean | null;
  className?: string;
}

const VerifiedBadge = ({ verified, className = "" }: Props) => {
  if (!verified) return null;
  return (
    <BadgeCheck
      className={`inline-block w-3.5 h-3.5 fill-[#1d9bf0] text-white shrink-0 ${className}`}
      aria-label="Verified"
    />
  );
};

export default VerifiedBadge;
