"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReluBuilderError,
  ReluBuilderResult,
  ReluBuilderStatus,
  runReluSummary,
  suggestReluEsco,
  suggestReluGeography,
  suggestReluNace,
  suggestReluTaxonomy,
} from "@/lib/relu-builder-api";

type LastRequest =
  | { type: "summary"; value: string }
  | { type: "taxonomy"; value: string }
  | { type: "esco"; value: string }
  | { type: "nace"; value: string }
  | { type: "geography"; value: string };

type UseReluBuilderOptions = {
  token?: string | null;
  limit?: number;
};

export function useReluBuilder(options: UseReluBuilderOptions = {}) {
  const [status, setStatus] = useState<ReluBuilderStatus>("idle");
  const [error, setError] = useState<ReluBuilderError | null>(null);
  const [lastResult, setLastResult] = useState<ReluBuilderResult | null>(null);
  const [lastRequest, setLastRequest] = useState<LastRequest | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const applyIfCurrent = useCallback((requestId: number, update: () => void) => {
    if (mountedRef.current && requestIdRef.current === requestId) {
      update();
    }
  }, []);

  const run = useCallback(
    async (request: LastRequest) => {
      const trimmedValue = request.value.trim();
      if (!trimmedValue) {
        setStatus("idle");
        setError(null);
        setLastResult(null);
        setLastRequest(null);
        return null;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setStatus("processing");
      setError(null);
      setLastRequest(request);

      try {
        const result = await executeRequest(request, options.token, options.limit);
        applyIfCurrent(requestId, () => {
          setLastResult(result);
          setStatus(result.status === "completed" ? "completed" : "review_required");
        });
        return result;
      } catch (caughtError) {
        const normalizedError = caughtError as ReluBuilderError;
        applyIfCurrent(requestId, () => {
          setError(normalizedError);
          setStatus(
            normalizedError.code === "provider_unavailable" ||
              normalizedError.code === "service_unavailable"
              ? "unavailable"
              : "failed",
          );
        });
        return null;
      }
    },
    [applyIfCurrent, options.limit, options.token],
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setStatus("idle");
    setError(null);
    setLastResult(null);
    setLastRequest(null);
  }, []);

  const retry = useCallback(() => {
    if (!lastRequest) {
      return Promise.resolve(null);
    }

    return run(lastRequest);
  }, [lastRequest, run]);

  const runSummary = useCallback(
    (text: string) => run({ type: "summary", value: text }),
    [run],
  );
  const suggestTaxonomy = useCallback(
    (query: string) => run({ type: "taxonomy", value: query }),
    [run],
  );
  const suggestEsco = useCallback(
    (query: string) => run({ type: "esco", value: query }),
    [run],
  );
  const suggestNace = useCallback(
    (query: string) => run({ type: "nace", value: query }),
    [run],
  );
  const suggestGeography = useCallback(
    (query: string) => run({ type: "geography", value: query }),
    [run],
  );

  return {
    status,
    loading: status === "processing",
    error,
    success: status === "completed" || status === "review_required",
    lastResult,
    reset,
    retry,
    runSummary,
    suggestTaxonomy,
    suggestEsco,
    suggestNace,
    suggestGeography,
  };
}

async function executeRequest(
  request: LastRequest,
  token?: string | null,
  limit?: number,
) {
  if (request.type === "summary") {
    return runReluSummary(request.value, token);
  }

  if (request.type === "taxonomy") {
    return suggestReluTaxonomy(request.value, token, limit);
  }

  if (request.type === "esco") {
    return suggestReluEsco(request.value, token, limit);
  }

  if (request.type === "nace") {
    return suggestReluNace(request.value, token, limit);
  }

  return suggestReluGeography(request.value, token, limit);
}
