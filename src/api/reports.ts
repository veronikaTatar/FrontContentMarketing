import api from './axios';
import type { PageResponse, PublicationReport } from '../types';

export const reportsApi = {
    publications: () => api.get<PageResponse<PublicationReport>>('/reports/publications'),
};
