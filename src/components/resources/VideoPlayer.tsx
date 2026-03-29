'use client';

import { useState } from 'react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  startTime?: number;
}

export default function VideoPlayer({ videoId, title, startTime = 0 }: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${startTime}&rel=0&modestbranding=1`;

  return (
    <div className="relative w-full aspect-video bg-navy-950 rounded-xl overflow-hidden">
      {!isLoaded && (
        <button
          onClick={() => setIsLoaded(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 group cursor-pointer"
          style={{
            backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
          <div className="relative z-10 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="relative z-10 text-sm font-medium text-white/90">{title}</span>
        </button>
      )}
      {isLoaded && (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      )}
    </div>
  );
}
