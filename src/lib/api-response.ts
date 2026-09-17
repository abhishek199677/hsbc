import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
  code?: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  [key: string]: unknown;
}

export interface ApiPaginated<T = unknown> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Standardized error response
 */
export function apiError(error: string, status: number, code?: string): NextResponse {
  const body: ApiError = { error };
  if (code) body.code = code;
  return NextResponse.json(body, { status });
}

/**
 * Standardized success response
 */
export function apiSuccess(data: Record<string, unknown>, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status });
}

/**
 * Standardized paginated response
 */
export function apiPaginated(
  data: unknown[],
  pagination: { page: number; limit: number; total: number },
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({
    success: true,
    ...extra,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}
