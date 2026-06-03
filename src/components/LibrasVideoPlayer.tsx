import { RefreshCw, VideoOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type VideoStatus = 'loading' | 'ready' | 'error';

type LibrasVideoPlayerProps = {
  src: string;
  title: string;
};

function withFirstFrameHint(src: string) {
  return src.includes('#') ? src : `${src}#t=0.001`;
}

export default function LibrasVideoPlayer({ src, title }: LibrasVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<VideoStatus>('loading');
  const videoSrc = useMemo(() => withFirstFrameHint(src), [src]);

  useEffect(() => {
    const video = videoRef.current;
    setStatus('loading');

    if (!video) return;

    video.setAttribute('webkit-playsinline', 'true');
    video.load();

    return () => {
      video.pause();
    };
  }, [videoSrc]);

  return (
    <div className="libras-video-frame relative mx-auto rounded-xl border border-[#1a3050] bg-black overflow-hidden">
      <video
        ref={videoRef}
        key={videoSrc}
        controls
        playsInline
        preload="metadata"
        title={title}
        aria-label={title}
        className="libras-video block h-full w-full bg-black object-contain"
        src={videoSrc}
        onLoadedMetadata={() => setStatus('ready')}
        onLoadedData={() => setStatus('ready')}
        onCanPlay={() => setStatus('ready')}
        onError={() => setStatus('error')}
      >
        Seu navegador não suporta vídeos.
      </video>

      {status === 'loading' && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-slate-300">
          Carregando vídeo...
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 px-4 text-center">
          <VideoOff className="h-8 w-8 text-red-300" />
          <p className="text-sm font-medium text-slate-200">Não foi possível carregar o vídeo.</p>
          <button
            type="button"
            onClick={() => {
              setStatus('loading');
              videoRef.current?.load();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2a4770] bg-[#0d1a2e] px-3 py-2 text-xs font-semibold text-blue-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
