'use client';

import { useState } from 'react';
import InterventionForm from '@/components/intervention/InterventionForm';
import InterventionList from '@/components/intervention/InterventionList';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';

export default function InterventionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // TODO: Récupérer les données du tenant depuis la session
  const tenant = {
    _id: 'tenant-id',
    name: 'Tenant Name',
    contacts: []
  };

  const handleSubmitSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // Force le refresh de la liste
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Demandes d'intervention</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          {showForm ? (
            <>
              <List className="h-4 w-4" />
              Voir mes demandes
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nouvelle demande
            </>
          )}
        </Button>
      </div>

      {showForm ? (
        <InterventionForm 
          tenant={tenant}
          onSubmit={handleSubmitSuccess}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <InterventionList key={refreshKey} />
      )}
    </div>
  );
}
