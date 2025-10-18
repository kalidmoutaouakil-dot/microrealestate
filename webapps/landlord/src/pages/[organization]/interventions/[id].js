import { fetchIntervention, updateIntervention, addInterventionComment, QueryKeys } from '../../../utils/restcalls';
import React, { useContext, useState } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';
import moment from 'moment';
import { LuClock, LuMapPin, LuUser, LuMail, LuPhone } from 'react-icons/lu';

const statusLabels = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminée',
  rejected: 'Refusée'
};

const priorityLabels = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente'
};

const categoryLabels = {
  plumbing: 'Plomberie',
  electricity: 'Électricité',
  heating: 'Chauffage',
  lock: 'Serrurerie',
  other: 'Autre'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

function InterventionDetail() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const queryClient = useQueryClient();
  const { id } = router.query;

  const [newComment, setNewComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { isError, data: intervention, isLoading } = useQuery({
    queryKey: [QueryKeys.INTERVENTION, id],
    queryFn: () => fetchIntervention(store, id),
    enabled: !!id
  });
   console.log('=== DEBUG INTERVENTION ===');
  console.log('intervention:', intervention);
  console.log('isLoading:', isLoading);
  console.log('isError:', isError);
  const updateStatusMutation = useMutation({
    mutationFn: (status) => updateIntervention(store, id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.INTERVENTION, id]);
      queryClient.invalidateQueries([QueryKeys.INTERVENTIONS]);
      toast.success('Statut mis à jour avec succès');
      setSelectedStatus('');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment) => addInterventionComment(store, id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries([QueryKeys.INTERVENTION, id]);
      toast.success('Commentaire ajouté avec succès');
      setNewComment('');
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  });

  const handleStatusChange = (status) => {
    if (status !== intervention.status) {
      updateStatusMutation.mutate(status);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    addCommentMutation.mutate({
      authorId: store.user.email,
      authorName: store.user.firstName + ' ' + store.user.lastName,
      authorRole: 'landlord',
      message: newComment
    });
  };

  if (isError) {
    toast.error(t('Error fetching intervention'));
  }

  if (isLoading || !intervention) {
    return <Page loading={true} />;
  }

  return (
    <Page dataCy="interventionDetailPage">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-4">{intervention.title}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1">{intervention.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {intervention.tenantName && (
                  <div className="flex items-center gap-2">
                    <LuUser className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{intervention.tenantName}</p>
                      {intervention.tenantEmail && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <LuMail className="h-3 w-3" />
                          {intervention.tenantEmail}
                        </p>
                      )}
                      {intervention.tenantPhone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <LuPhone className="h-3 w-3" />
                          {intervention.tenantPhone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {intervention.propertyName && (
                  <div className="flex items-center gap-2">
                    <LuMapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{intervention.propertyName}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <LuClock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Créée le {moment(intervention.createdDate).format('DD/MM/YYYY HH:mm')}</p>
                </div>

                {intervention.updatedDate !== intervention.createdDate && (
                  <div className="flex items-center gap-2">
                    <LuClock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">Mise à jour le {moment(intervention.updatedDate).format('DD/MM/YYYY HH:mm')}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Changer le statut */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Changer le statut</h2>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="status">Nouveau statut</Label>
                <Select 
                  value={selectedStatus || intervention.status} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="rejected">Refusée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => handleStatusChange(selectedStatus)}
                disabled={updateStatusMutation.isLoading || !selectedStatus || selectedStatus === intervention.status}
              >
                {updateStatusMutation.isLoading ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ajouter un commentaire */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Ajouter un commentaire</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Votre commentaire sera visible par le locataire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />
              <Button 
                onClick={handleAddComment}
                disabled={addCommentMutation.isLoading || !newComment.trim()}
              >
                {addCommentMutation.isLoading ? 'Ajout...' : 'Ajouter le commentaire'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des commentaires */}
        {intervention.comments && intervention.comments.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Historique des commentaires</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {intervention.comments.map((comment, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4 py-2">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{comment.authorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {comment.authorRole === 'landlord' ? 'Propriétaire' : 'Locataire'} - {moment(comment.date).format('DD/MM/YYYY HH:mm')}
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
    </Page>
  );
}

export default withAuthentication(InterventionDetail);
