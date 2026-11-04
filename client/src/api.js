const TOKEN_KEY = "reportes_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers, body });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifica que esté en ejecución.",
      0
    );
  }

  if (response.status === 204) return null;

  const isJson = (response.headers.get("content-type") || "").includes(
    "application/json"
  );
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    if (
      response.status === 401 &&
      getToken() &&
      !path.startsWith("/auth/login")
    ) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw new ApiError(
      data?.error?.message || "Ocurrió un error inesperado",
      response.status,
      data?.error?.details
    );
  }

  return data;
}

async function getBlob(path) {
  const token = getToken();
  const response = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new ApiError("No se pudo cargar la imagen", response.status);
  }
  return response.blob();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),
  getBlob,
};
