// components/Rating.js
import { useState } from 'react';

export default function Rating({ rating, editable = false, onRatingChange }) {
    const [hoverRating, setHoverRating] = useState(0);
    
    return (
        <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`text-2xl ${editable ? 'cursor-pointer' : 'cursor-default'} ${
                        star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    onClick={() => editable && onRatingChange(star)}
                    onMouseEnter={() => editable && setHoverRating(star)}
                    onMouseLeave={() => editable && setHoverRating(0)}
                >
                    ★
                </button>
            ))}
        </div>
    );
}