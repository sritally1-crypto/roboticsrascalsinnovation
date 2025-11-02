import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, Trash2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ArchivedArtifact {
  id: string;
  title: string;
  description: string | null;
  artifact_type: string;
  model_url: string | null;
  thumbnail_url: string | null;
  metadata: any;
  created_at: string;
}

export const ArchiveTab = () => {
  const { user } = useAuth();
  const [artifacts, setArtifacts] = useState<ArchivedArtifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadArtifacts();
    }
  }, [user]);

  const loadArtifacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('archived_artifacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load archived artifacts');
    } else {
      setArtifacts(data || []);
    }
    setLoading(false);
  };

  const deleteArtifact = async (id: string) => {
    const { error } = await supabase
      .from('archived_artifacts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete artifact');
    } else {
      toast.success('Artifact deleted');
      loadArtifacts();
    }
  };

  const getTypeIcon = (type: string) => {
    return <Archive className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading your archive...</p>
        </div>
      </Card>
    );
  }

  if (artifacts.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <Archive className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No archived artifacts yet</h3>
          <p className="text-muted-foreground">
            Save your 3D scans and reconstructions to access them later
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {artifacts.map((artifact) => (
        <Card key={artifact.id} className="overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-earth-warm/20 to-primary/20 flex items-center justify-center">
            {getTypeIcon(artifact.artifact_type)}
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold line-clamp-1">{artifact.title}</h3>
                <Badge variant="secondary" className="shrink-0">
                  {artifact.artifact_type.replace('_', ' ')}
                </Badge>
              </div>
              {artifact.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {artifact.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {artifact.model_url && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(artifact.model_url!, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = artifact.model_url!;
                      a.download = `${artifact.title}.glb`;
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteArtifact(artifact.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Saved {new Date(artifact.created_at).toLocaleDateString()}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
