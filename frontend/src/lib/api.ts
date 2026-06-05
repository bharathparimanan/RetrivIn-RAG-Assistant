const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('retrivin_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('retrivin_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────
export async function register(email: string, password: string) {
  const data = await request<{ access_token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('retrivin_token', data.access_token);
  return data;
}

export async function login(email: string, password: string) {
  const data = await request<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('retrivin_token', data.access_token);
  return data;
}

// ── Documents ─────────────────────────────────────────
export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem('retrivin_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return res.json() as Promise<{
    document_id: string;
    filename: string;
    status: string;
  }>;
}

export async function getDocumentStatus(documentId: string) {
  return request<{ document_id: string; status: string; filename: string }>(
    `/documents/${documentId}/status`
  );
}

export async function listDocuments() {
  return request<
    Array<{
      document_id: string;
      filename: string;
      status: string;
      doc_type: string;
    }>
  >('/documents/');
}

// ── Sessions ──────────────────────────────────────────
export async function createSession(
  mode: string,
  targetRole: string,
  documentIds: string[]
) {
  return request<{ session_id: string; status: string }>('/sessions/', {
    method: 'POST',
    body: JSON.stringify({
      mode,
      target_role: targetRole,
      document_ids: documentIds,
    }),
  });
}

export async function getSession(sessionId: string) {
  return request<{
    session_id: string;
    mode: string;
    target_role: string;
    status: string;
    questions: Array<{
      id: string;
      index: number;
      text: string;
      source: string;
      section: string;
      difficulty: string;
    }>;
  }>(`/sessions/${sessionId}`);
}

export async function getSessionQuestions(sessionId: string) {
  return request<{
    session_id: string;
    status: string;
    questions: Array<{
      id: string;
      text: string;
      source: string;
      section: string;
    }>;
  }>(`/sessions/${sessionId}/questions`);
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answerText: string
) {
  return request<{ answer_id: string; status: string }>(
    `/sessions/${sessionId}/answers`,
    {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        answer_text: answerText,
      }),
    }
  );
}
