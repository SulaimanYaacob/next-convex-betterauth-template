import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameCardProps {
  name: string;
  genre: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  skillSupport?: "none" | "singleplayer" | "multiplayer";
}

export function GameCard({
  name,
  genre,
  slug,
  description,
  thumbnailUrl,
  skillSupport = "none",
}: GameCardProps) {
  const skillLabel =
    skillSupport === "none"
      ? "No skills"
      : skillSupport === "singleplayer"
        ? "Solo skills"
        : "Skills enabled";

  return (
    <Link
      href={`/play/${slug}`}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="gap-0 overflow-hidden rounded-md py-0 shadow-sm transition-shadow duration-200 hover:shadow-md">
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
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {description ?? "Fast, focused play with clear rewards."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {genre}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {skillLabel}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
