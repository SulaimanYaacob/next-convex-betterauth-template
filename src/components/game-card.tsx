import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameCardProps {
  name: string;
  genre: string;
}

export function GameCard({ name, genre }: GameCardProps) {
  return (
    <Card className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 gap-0 py-0 focus-visible:ring-2 focus-visible:ring-ring">
      <div
        className="aspect-video bg-muted animate-pulse"
        aria-hidden="true"
      />
      <div className="p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <Badge variant="outline" className="text-xs">
          {genre}
        </Badge>
      </div>
    </Card>
  );
}
