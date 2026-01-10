import { getVideoEmbedUrl } from "@/lib/course";

type VideoPlayerProps = {
  videoId: string;
  title: string;
};

export default function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-black/10 bg-black shadow-[0_18px_50px_-35px_rgba(0,0,0,0.6)]">
      <div className="aspect-video w-full">
        <iframe
          className="h-full w-full"
          src={getVideoEmbedUrl(videoId)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
