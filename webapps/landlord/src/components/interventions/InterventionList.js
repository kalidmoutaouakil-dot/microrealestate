import React, { useEffect, useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import { Card, CardContent } from '../ui/card';
import { LuClock, LuMapPin, LuUser } from 'react-icons/lu';
import { useRouter } from 'next/router';
import moment from 'moment';

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

export default observer(function InterventionList() {
  const router = useRouter();
  const store = useContext(StoreContext);
  const { items: interventions, fetch } = store.intervention;

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleClick = (interventionId) => {
    router.push(`/${router.query.organization}/interventions/${interventionId}`);
  };

  if (!interventions.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucune demande d'intervention
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {interventions.map((intervention) => (
        <Card
          key={intervention._id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleClick(intervention._id)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {intervention.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[intervention.status]
                    }`}
                  >
                    {statusLabels[intervention.status]}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      priorityColors[intervention.priority]
                    }`}
                  >
                    {priorityLabels[intervention.priority]}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                    {categoryLabels[intervention.category]}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {intervention.description}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {intervention.tenantName && (
                <div className="flex items-center gap-1">
                  <LuUser className="h-4 w-4" />
                  <span>{intervention.tenantName}</span>
                </div>
              )}
              {intervention.propertyName && (
                <div className="flex items-center gap-1">
                  <LuMapPin className="h-4 w-4" />
                  <span>{intervention.propertyName}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <LuClock className="h-4 w-4" />
                <span>{moment(intervention.createdDate).format('DD/MM/YYYY HH:mm')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
