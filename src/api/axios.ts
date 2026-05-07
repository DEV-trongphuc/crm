import axios from 'axios';
import { DEV_MODE } from '../config/env';
import { useMockStore } from '../store/mockStore';

// Auto-detect: local dev uses Vite proxy, production uses real URL
const BASE_URL = import.meta.env.VITE_API_URL ?? '/backend';

// Custom Mock Adapter for PURE DEMO MODE
const mockAdapter = (config: any): Promise<any> => {
  return new Promise((resolve) => {
    const state = useMockStore.getState();
    const url = config.url || '';
    const method = config.method?.toLowerCase();
    let responseData: any = null;

    // Mapping API endpoints to Mock Store data
    if (url.includes('/contacts')) {
      responseData = { items: state.contacts, total: state.contacts.length };
    } else if (url.includes('/users')) {
      responseData = state.users;
    } else if (url.includes('/deals')) {
      responseData = state.deals;
    } else if (url.includes('/activities')) {
      responseData = state.activities;
    } else if (url.includes('/expenses')) {
      responseData = state.expenses;
    } else if (url.includes('/invoices')) {
      responseData = state.invoices;
    } else if (url.includes('/tickets')) {
      responseData = state.tickets;
    } else if (url.includes('/products')) {
      responseData = state.products;
    } else if (url.includes('/batches')) {
      responseData = state.batches;
    } else if (url.includes('/notifications')) {
      responseData = state.notifications;
    } else if (url.includes('/quotes')) {
      responseData = state.quotes;
    } else if (url.includes('/pipeline-stages')) {
      responseData = state.pipeline_stages;
    } else if (url.includes('/tags')) {
      responseData = state.tags;
    } else if (url.includes('/suppliers')) {
      responseData = state.suppliers;
    } else if (url.includes('/dashboard/stats')) {
      responseData = {
        revenue: 1250000000,
        revenue_change: 12.5,
        gross_profit: 450000000,
        gross_profit_change: 8.2,
        new_contacts: 48,
        new_contacts_change: 5.4,
        total_contacts: 1250,
        total_contacts_change: 2.1,
        active_deals: 15,
        deals_value: 4200000000,
        conversion_rate: 64
      };
    }

    // Simulate network delay for realism
    setTimeout(() => {
      // For mutations (POST, PUT, DELETE), always return success in DEV_MODE
      if (['post', 'put', 'delete', 'patch'].includes(method || '')) {
        resolve({
          data: { success: true, message: 'DEMO MODE: Action simulated successfully', data: config.data ? JSON.parse(config.data) : {} },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
        return;
      }

      // For GET, return mapped data or empty success
      resolve({
        data: { success: true, data: responseData || [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    }, 300);
  });
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  // Use mock adapter if DEV_MODE is active
  adapter: DEV_MODE ? (mockAdapter as any) : undefined,
});


// Attach access token
api.interceptors.request.use((config) => {
  // Block mutations in DEV_MODE
  if (DEV_MODE && config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
    console.warn(`DEV_MODE ACTIVE: Blocking ${config.method.toUpperCase()} request to ${config.url}`);
    return Promise.reject({ 
      message: 'Không thể thực hiện khi đang ở DEMO MODE',
      response: {
        data: {
          success: false,
          message: 'Không thể thực hiện khi đang ở DEMO MODE'
        }
      },
      isMockBlock: true 
    });
  }

  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    // Don't intercept 401s from login or refresh endpoints themselves
    if (
      error.response?.status === 401 && 
      !original._retry && 
      !original.url?.includes('/auth/login') && 
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
        const { access_token, refresh_token } = data.data;
        localStorage.setItem('access_token', access_token);
        if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
        original.headers.Authorization = `Bearer ${access_token}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 500) {
      console.error('SERVER ERROR:', error.response.data);
      // We don't have direct access to addToast here easily without a store or window property.
      // But we can ensure the error is descriptive for the caller.
    }
    return Promise.reject(error);
  }
);

export default api;
