import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Play, Pause, Volume2 } from "lucide-react";

interface Discovery {
  id: string;
  title: string;
  location: string;
  archaeologist: string;
  avatar: string;
  description: string;
  likes: number;
  comments: number;
  period: string;
  isVideo: boolean;
  thumbnail: string;
  isPlaying?: boolean;
}

const mockDiscoveries: Discovery[] = [
  {
    id: "1",
    title: "Bronze Age Ceremonial Dagger",
    location: "Crete, Greece",
    archaeologist: "Dr. Elena Kostova",
    avatar: "EK",
    description: "Stunning bronze dagger with intricate spiral patterns discovered in a Minoan palace complex. The craftsmanship suggests high-status burial.",
    likes: 2847,
    comments: 234,
    period: "1500-1400 BCE",
    isVideo: true,
    thumbnail: "🗡️",
    isPlaying: false
  },
  {
    id: "2", 
    title: "Roman Mosaic Floor Unveiled",
    location: "Bath, England",
    archaeologist: "Prof. James Mitchell",
    avatar: "JM",
    description: "Incredible preservation of a Roman villa's mosaic floor. Each tile tells a story of daily life in ancient Britannia.",
    likes: 1923,
    comments: 189,
    period: "200-300 CE",
    isVideo: true,
    thumbnail: "🏛️",
    isPlaying: false
  },
  {
    id: "3",
    title: "Viking Trade Beads Discovery",
    location: "York, England", 
    archaeologist: "Dr. Sarah Nordheim",
    avatar: "SN",
    description: "Colorful glass beads from across the known world found in a Viking merchant's grave. Evidence of extensive trade networks.",
    likes: 3102,
    comments: 445,
    period: "800-1000 CE",
    isVideo: false,
    thumbnail: "📿"
  }
];

const Public = () => {
  const [discoveries, setDiscoveries] = useState(mockDiscoveries);

  const toggleLike = (id: string) => {
    setDiscoveries(prev => 
      prev.map(discovery => 
        discovery.id === id 
          ? { ...discovery, likes: discovery.likes + 1 }
          : discovery
      )
    );
  };

  const togglePlay = (id: string) => {
    setDiscoveries(prev =>
      prev.map(discovery =>
        discovery.id === id
          ? { ...discovery, isPlaying: !discovery.isPlaying }
          : { ...discovery, isPlaying: false }
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-discovery-gold/5 to-background">
      <div className="container mx-auto max-w-2xl p-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Archaeology</h1>
          <p className="text-muted-foreground">Live discoveries from archaeological sites worldwide</p>
        </div>

        <div className="space-y-6">
          {discoveries.map((discovery) => (
            <Card key={discovery.id} className="overflow-hidden">
              {/* Header */}
              <div className="p-4 flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {discovery.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{discovery.archaeologist}</p>
                  <p className="text-sm text-muted-foreground">{discovery.location}</p>
                </div>
                <Badge variant="secondary" className="bg-discovery-gold/10 text-discovery-gold">
                  {discovery.period}
                </Badge>
              </div>

              {/* Content */}
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-earth-warm/20 to-primary/20 flex items-center justify-center text-8xl">
                  {discovery.thumbnail}
                  {discovery.isVideo && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute inset-0 w-full h-full bg-black/30 hover:bg-black/40 text-white"
                      onClick={() => togglePlay(discovery.id)}
                    >
                      {discovery.isPlaying ? (
                        <Pause className="h-16 w-16" />
                      ) : (
                        <Play className="h-16 w-16" />
                      )}
                    </Button>
                  )}
                </div>
                
                {discovery.isVideo && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-black/50 text-white">
                      {discovery.isPlaying ? "Playing" : "Video"}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(discovery.id)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
                  >
                    <Heart className="h-5 w-5" />
                    {discovery.likes.toLocaleString()}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {discovery.comments}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Share className="h-5 w-5" />
                    Share
                  </Button>

                  {discovery.isVideo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-muted-foreground ml-auto"
                    >
                      <Volume2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">{discovery.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {discovery.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" size="lg">
            Load More Discoveries
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Public;