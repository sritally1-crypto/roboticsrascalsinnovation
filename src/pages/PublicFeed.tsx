import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Discovery {
  id: string;
  title: string;
  description: string | null;
  type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    username: string | null;
  } | null;
}

const PublicFeed = () => {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDiscoveries();
  }, []);

  const loadDiscoveries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('discoveries')
      .select(`
        *,
        profiles!discoveries_user_id_fkey (
          display_name,
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load discoveries');
    } else {
      setDiscoveries(data as any || []);
    }
    setLoading(false);
  };

  const toggleLike = async (id: string) => {
    const isLiked = likedIds.has(id);
    
    if (isLiked) {
      setLikedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setDiscoveries(prev =>
        prev.map(d => d.id === id ? { ...d, likes_count: d.likes_count - 1 } : d)
      );
    } else {
      setLikedIds(prev => new Set(prev).add(id));
      setDiscoveries(prev =>
        prev.map(d => d.id === id ? { ...d, likes_count: d.likes_count + 1 } : d)
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-discovery-gold/5 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-discovery-gold/5 to-background">
      <div className="container mx-auto max-w-2xl p-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Archaeology</h1>
          <p className="text-muted-foreground">Live discoveries from archaeological sites worldwide</p>
        </div>

        {discoveries.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No discoveries yet. Be the first to post!</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {discoveries.map((discovery) => (
              <Card key={discovery.id} className="overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {discovery.profiles?.display_name?.charAt(0) || 
                       discovery.profiles?.username?.charAt(0) || 
                       'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {discovery.profiles?.display_name || discovery.profiles?.username || 'Anonymous'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(discovery.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-discovery-gold/10 text-discovery-gold">
                    {discovery.type.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Content */}
                {discovery.thumbnail_url && (
                  <div className="relative">
                    <div className="aspect-square bg-gradient-to-br from-earth-warm/20 to-primary/20 flex items-center justify-center">
                      <img 
                        src={discovery.thumbnail_url} 
                        alt={discovery.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(discovery.id)}
                      className={`flex items-center gap-2 ${
                        likedIds.has(discovery.id) 
                          ? 'text-destructive' 
                          : 'text-muted-foreground hover:text-destructive'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${likedIds.has(discovery.id) ? 'fill-current' : ''}`} />
                      {discovery.likes_count.toLocaleString()}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      <MessageCircle className="h-5 w-5" />
                      {discovery.comments_count}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      <Share className="h-5 w-5" />
                      Share
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{discovery.title}</h3>
                    {discovery.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {discovery.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" size="lg" onClick={loadDiscoveries}>
            Refresh Feed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicFeed;
