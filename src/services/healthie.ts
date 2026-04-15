import fetch from 'node-fetch';

const HEALTHIE_API_URL = process.env.HEALTHIE_API_URL || 'https://api.gethealthie.com/graphql';
const HEALTHIE_API_KEY = process.env.HEALTHIE_API_KEY || '';

export async function healthieQuery(query: string, variables: Record<string, any> = {}): Promise<any> {
  if (!HEALTHIE_API_KEY) {
    throw new Error('HEALTHIE_API_KEY environment variable is not set');
  }

  const response = await fetch(HEALTHIE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${HEALTHIE_API_KEY}`,
      'AuthorizationSource': 'API',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Healthie API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`Healthie GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}
