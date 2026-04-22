import api from './axios';

export const integrationsApi = {
    syncGoogleCalendar: () => api.post('/integrations/google/calendar/sync'),
};
