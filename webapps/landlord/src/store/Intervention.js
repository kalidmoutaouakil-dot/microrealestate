import { action, flow, makeObservable, observable } from 'mobx';
import { apiFetcher } from '../utils/fetch';

export default class Intervention {
  selected = {};
  filters = { searchText: '', statuses: [] };
  items = [];

  constructor() {
    makeObservable(this, {
      selected: observable,
      filters: observable,
      items: observable,
      setSelected: action,
      setFilters: action,
      fetch: flow
    });
  }

  setSelected = (intervention) => {
    this.selected = intervention;
  };

  setFilters = (filters) => {
    this.filters = filters;
  };

  *fetch() {
    try {
      const response = yield apiFetcher().get('/interventions');
      this.items = response.data;
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
