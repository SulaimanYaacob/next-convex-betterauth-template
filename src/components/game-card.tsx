import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameCardProps {
  name: string;
  genre: string;
  slug: string;
  thumbnailUrl?: string;
}

export function GameCard({ name, genre, slug, thumbnailUrl }: GameCardProps) {
  return (
    <Link
      href={`/play/${slug}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 gap-0 py-0">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={name}
              fill
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-muted" aria-hidden="true" />
          )}
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <Badge variant="outline" className="text-xs">
            {genre}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
