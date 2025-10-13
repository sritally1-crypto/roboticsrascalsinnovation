import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MapPin, Calendar, User, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Discovery {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  metadata: any;
  isLiked?: boolean;
}

export const Public = () => {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoveries();
  }, []);

  const fetchDiscoveries = async () => {
    try {
      const { data, error } = await supabase
        .from('discoveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Check which posts current user has liked
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: likes } = await supabase
          .from('discovery_likes')
          .select('discovery_id')
          .eq('user_id', user.id);

        const likedIds = new Set(likes?.map(l => l.discovery_id) || []);
        setDiscoveries(data.map(d => ({ ...d, isLiked: likedIds.has(d.id) })));
      } else {
        setDiscoveries(data);
      }
    } catch (error) {
      console.error('Error fetching discoveries:', error);
      toast.error('Failed to load discoveries');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to like posts");
        return;
      }

      const discovery = discoveries.find(d => d.id === id);
      if (!discovery) return;

      if (discovery.isLiked) {
        // Unlike
        await supabase
          .from('discovery_likes')
          .delete()
          .eq('discovery_id', id)
          .eq('user_id', user.id);
        
        setDiscoveries(discoveries.map(d => 
          d.id === id ? { ...d, isLiked: false, likes_count: d.likes_count - 1 } : d
        ));
      } else {
        // Like
        await supabase
          .from('discovery_likes')
          .insert({ discovery_id: id, user_id: user.id });
        
        setDiscoveries(discoveries.map(d => 
          d.id === id ? { ...d, isLiked: true, likes_count: d.likes_count + 1 } : d
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-discovery-gold/5 to-background">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Archaeology</h1>
          <p className="text-muted-foreground">Explore 3D scans and AI analysis from the community</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading discoveries...</p>
          </div>
        ) : discoveries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No discoveries yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discoveries.map((discovery) => (
              <Card key={discovery.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative aspect-video bg-gradient-to-br from-stone-light to-discovery-gold/20">
                  {discovery.thumbnail_url || discovery.media_url ? (
                    <img 
                      src={discovery.thumbnail_url || discovery.media_url || ''} 
                      alt={discovery.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Eye className="h-16 w-16 text-muted-foreground opacity-20" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-background/80">
                    {discovery.type === '3d_scan' ? '3D Scan' : 'AI Analysis'}
                  </Badge>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{discovery.title}</h3>
                    {discovery.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{discovery.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(discovery.created_at).toLocaleDateString()}</span>
                  </div>

                  {discovery.metadata?.photoCount && (
                    <div className="text-sm text-muted-foreground">
                      {discovery.metadata.photoCount} photos used
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleLike(discovery.id)}
                      className="flex items-center gap-2"
                    >
                      <Heart className={`h-4 w-4 ${discovery.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{discovery.likes_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{discovery.comments_count}</span>
                    </Button>
                    {discovery.media_url && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(discovery.media_url!, '_blank')}
                        className="ml-auto"
                      >
                        View 3D
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && discoveries.length >= 20 && (
          <div className="text-center mt-8">
            <Button size="lg" variant="outline" onClick={fetchDiscoveries}>
              Load More Discoveries
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Public;
