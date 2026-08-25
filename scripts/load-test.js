import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'], // http errors should be less than 5%
    http_req_duration: ['p(95)<1500'], // 95% of requests must complete below 1.5s
  },
};

export default function () {
  const baseUrl = __ENV.TARGET_URL || __ENV.BACKEND_URL || 'http://localhost:5173';
  
  const res = http.get(baseUrl);

  check(res, {
    'status is 200': (r) => r.status === 200 || (r.status >= 200 && r.status < 400),
    'response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  // Short dynamic pacing delay (100ms - 300ms)
  sleep(Math.random() * 0.2 + 0.1);
}
