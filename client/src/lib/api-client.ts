// src/lib/api-client.ts
/**
 * Next.js API Routes를 호출하는 클라이언트 유틸리티
 * FastAPI는 Next.js API Routes에서 처리
 */

/**
 * Generic fetch wrapper
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.log('>>> Error:', errorData.error || 'Unknown error', '<<');
    console.log('>>> Response:', response);
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * API Client
 */
export const apiClient = {
  // Statistics
  stats: {
    getPositions: () => fetchAPI('/stats/positions'),
  },

  // Positions
  positions: {
    list: () => fetchAPI('/positions'),

    create: (data: any) =>
      fetchAPI('/positions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getCandidates: (positionId: string) =>
      fetchAPI(`/positions/${positionId}/candidates`),
  },

  // Candidates
  candidates: {
    recommended: (limit?: number) => {
      const query = limit ? `?limit=${limit}` : '';
      return fetchAPI(`/candidates/recommended${query}`);
    },

    getDetail: (candidateId: string) =>
      fetchAPI(`/candidates/${candidateId}`),

    update: (candidateId: string, data: any) =>
      fetchAPI(`/candidates/${candidateId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (candidateId: string) =>
      fetchAPI(`/candidates/${candidateId}`, {
        method: 'DELETE',
      }),
  },

  // Applicants
  applicants: {
    list: (params?: { status?: string; position_id?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.position_id) searchParams.append('position_id', params.position_id);

      const query = searchParams.toString();
      return fetchAPI(`/applicants${query ? `?${query}` : ''}`);
    },

    create: async (formData: FormData) => {
      const response = await fetch('/api/applicants', {
        method: 'POST',
        body: formData, // FormData는 Content-Type 자동 설정
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('>>> Error Response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || 'Failed to create applicant');
      }

      return response.json();
    },
  },

  // Resumes
  resumes: {
    upload: async (formData: FormData) => {
      const response = await fetch('/api/resumes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload resume');
      }

      return response.json();
    },

    list: (applicantId?: string) => {
      const query = applicantId ? `?applicant_id=${applicantId}` : '';
      return fetchAPI(`/resumes${query}`);
    },

    getProcessingStatus: (resumeId: number) =>
      fetchAPI(`/upload/status/${resumeId}`),
  },

  // Ask (QA)
  ask: (resumeId: string, question: string) =>
    fetchAPI('/ask', {
      method: 'POST',
      body: JSON.stringify({ resumeId, question }),
    }),
};

// 편의를 위한 개별 export
export const {
  stats,
  positions,
  candidates,
  applicants,
  resumes,
  ask,
} = apiClient;