import posthog from 'posthog-js';

let analyticsInitialized = false;

const posthogProjectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

export function initAnalytics() {
  if (analyticsInitialized || !posthogProjectToken || !posthogHost) return;

  posthog.init(posthogProjectToken, {
    api_host: posthogHost,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_surveys_automatic_display: true,
    disable_web_experiments: true,
    advanced_disable_feature_flags: true,
    advanced_disable_feature_flags_on_first_load: true,
    advanced_disable_decide: true
  });

  analyticsInitialized = true;
}

export function trackEvent(eventName, metadata = {}) {
  if (!analyticsInitialized || !eventName) return;
  posthog.capture(eventName, metadata);
}

export function identifyUser(userId) {
  if (!analyticsInitialized || !userId) return;
  posthog.identify(userId);
}

export function resetAnalytics() {
  if (!analyticsInitialized) return;
  posthog.reset();
}

export function scoreToBucket(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return undefined;
  if (numericScore >= 8) return 'high';
  if (numericScore >= 5) return 'medium';
  return 'low';
}
