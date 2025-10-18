import { fetchInterventions, QueryKeys } from '../../../utils/restcalls';
import React, { useContext } from 'react';
import { List } from '../../../components/ResourceList';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';
import InterventionList from '../../../components/interventions/InterventionList';

function _filterData(data, filters) {
  let filteredItems = data;

  // Filtrer par statut
  if (filters.statuses?.length > 0) {
    filteredItems = filteredItems.filter(({ status }) =>
      filters.statuses.includes(status)
    );
  }

  // Filtrer par recherche
  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    filteredItems = filteredItems.filter(
      ({ title, description, tenantName, propertyName }) =>
        title?.toLowerCase().includes(searchLower) ||
        description?.toLowerCase().includes(searchLower) ||
        tenantName?.toLowerCase().includes(searchLower) ||
        propertyName?.toLowerCase().includes(searchLower)
    );
  }

  return filteredItems;
}

function Interventions() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const { isError, data, isLoading } = useQuery({
    queryKey: [QueryKeys.INTERVENTIONS],
    queryFn: () => fetchInterventions(store)
  });
  console.log('Interventions data:', data); 

  if (isError) {
    toast.error(t('Error fetching interventions'));
  }

  return (
    <Page loading={isLoading} dataCy="interventionsPage">
      <List
        data={data}
        filters={[
          { id: 'pending', label: 'En attente' },
          { id: 'in_progress', label: 'En cours' },
          { id: 'completed', label: 'Terminée' },
          { id: 'rejected', label: 'Refusée' }
        ]}
        filterFn={_filterData}
        renderActions={() => null}
        renderList={(filteredData) => (
          <InterventionList interventions={filteredData?.data || []} />
        )}
      />
    </Page>
  );
}

export default withAuthentication(Interventions);
