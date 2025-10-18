'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Calendar, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
}

const categoryLabels: Record<string, string> = {
  plumbing: 'Plomberie',
  electricity: 'Électricité',
  heating: 'Chauffage',
  lock: 'Serrurerie',
  other: 'Autre'
};

const priorityLabels: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente'
};

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminée',
  rejected: 'Refusée'
};

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export default function InterventionList() {
  const router = useRouter();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInterventions();
  }, []);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel direct à tenantapi comme le fait InterventionForm
      const response = await fetch('/tenantapi/interventions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des interventions');
      }

      const data = await response.json();
      setInterventions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
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

  const handleInterventionClick = (interventionId: string) => {
    router.push(`/fr/interventions/${interventionId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (interventions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune demande d'intervention pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {interventions.map((intervention) => (
        <Card 
          key={intervention._id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleInterventionClick(intervention._id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{intervention.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityColors[intervention.priority]}`}>
                    {priorityLabels[intervention.priority]}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[intervention.status]}`}>
                    {statusLabels[intervention.status]}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-gray-300 bg-white text-gray-800 px-2.5 py-0.5 text-xs font-semibold">
                    {categoryLabels[intervention.category]}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{intervention.description}</p>
              </div>
              
              {intervention.propertyName && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bien concerné</p>
                  <p className="text-sm font-medium">{intervention.propertyName}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
      ))}
    </div>
  );
}
