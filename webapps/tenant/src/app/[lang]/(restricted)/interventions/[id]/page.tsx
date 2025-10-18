'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, ArrowLeft, AlertCircle } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminée',
  rejected: 'Refusée'
};

const priorityLabels: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente'
};

const categoryLabels: Record<string, string> = {
  plumbing: 'Plomberie',
  electricity: 'Électricité',
  heating: 'Chauffage',
  lock: 'Serrurerie',
  other: 'Autre'
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

interface Comment {
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  date: string;
}

interface Intervention {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  propertyName: string;
  createdDate: string;
  updatedDate: string;
  tenantId: string;   
  tenantName: string;
  comments?: Comment[];
}

export default function InterventionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIntervention();
    }
  }, [id]);

  const fetchIntervention = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/tenantapi/interventions/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'intervention');
      }

      const data = await response.json();
      console.log('=== INTERVENTION FETCHED ===');
      console.log('Full data:', data);
      console.log('Comments:', data.comments);
      setIntervention(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/tenantapi/interventions/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorId: intervention.tenantId,
          authorName: intervention.tenantName,
          authorRole: 'tenant',
          message: newComment
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du commentaire');
      }

      setNewComment('');
      await fetchIntervention(); // Recharger pour voir le nouveau commentaire
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !intervention) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Intervention non trouvée'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{intervention.title}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[intervention.status]}`}>
              {statusLabels[intervention.status]}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[intervention.priority]}`}>
              {priorityLabels[intervention.priority]}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border">
              {categoryLabels[intervention.category]}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="mt-1">{intervention.description}</p>
            </div>

            {intervention.propertyName && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Bien concerné</Label>
                <p className="mt-1">{intervention.propertyName}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
              <Calendar className="h-4 w-4" />
              <span>Créée le {formatDate(intervention.createdDate)}</span>
            </div>

            {intervention.updatedDate !== intervention.createdDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Mise à jour le {formatDate(intervention.updatedDate)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ajouter un commentaire */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un commentaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Votre commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
            <Button 
              onClick={handleAddComment}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Ajouter le commentaire'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique des commentaires */}
      {intervention.comments && intervention.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des échanges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {intervention.comments.map((comment, index) => (
                <div 
                  key={index} 
                  className={`border-l-4 pl-4 py-2 ${
                    comment.authorRole === 'landlord' 
                      ? 'border-blue-500' 
                      : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{comment.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {comment.authorRole === 'landlord' ? '🏠 Propriétaire' : '👤 Vous'} - {formatDate(comment.date)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm">{comment.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
