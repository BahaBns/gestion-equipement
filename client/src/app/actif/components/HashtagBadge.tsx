// components/HashtagBadge.tsx
import React from "react";
import { XCircle } from "lucide-react";

interface HashtagBadgeProps {
  name: string;
  onRemove?: () => void;
  onClick?: () => void;
  isClickable?: boolean;
}

const HashtagBadge: React.FC<HashtagBadgeProps> = ({
  name,
  onRemove,
  onClick,
  isClickable = false,
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-1 ${
        isClickable ? "cursor-pointer hover:bg-blue-200" : ""
      }`}
      onClick={onClick}
    >
      #{name}
      {onRemove && (
        <XCircle
          className="ml-1 h-3 w-3 text-blue-500 hover:text-blue-700 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </span>
  );
};

export default HashtagBadge;
