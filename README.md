This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Gitlab api 

Reference:  https://docs.gitlab.com/api/rest/

**Get all projects**

```php
    $response = $this->httpClient->request('GET', "{$this->gitlabUrl}/projects", [
        'headers' => [
            'PRIVATE-TOKEN' => $this->gitlabToken
        ],
        'query' => [
            'membership' => true,
            'per_page' => 100
        ]
    ]);

    return $response->toArray();
```

**Get All users**


```php
    $response = $this->httpClient->request('GET', "{$this->gitlabUrl}/users", [
        'headers' => [
            'PRIVATE-TOKEN' => $this->gitlabToken
        ],
        'query' => [
            'per_page' => 100
        ]
    ]);

    return $response->toArray();
```

**Get Project activities**

```php
    $response = $this->httpClient->request('GET', "{$this->gitlabUrl}/projects/{projectId}/activities", [
        'headers' => [
            'PRIVATE-TOKEN' => $this->gitlabToken
        ],
        'on_success' => function ($response) use ($projectId) {
            $data = $response->toArray();
        }           
    ]);

    return $response->toArray();
```

**Get recents commits by project**

```php
    $response = $this->httpClient->request('GET', "{$this->gitlabUrl}/projects/{$projectId}/repository/commits", [
        'headers' => [
            'PRIVATE-TOKEN' => $this->gitlabToken,
            'Accept' => 'application/json'  // Forcer JSON pour plus de rapidité
        ],
        'query' => array_merge($query, [
            'per_page' => 50,   // Limiter à 50 pour une réponse très rapide
            'all' => true       // Conserver les commits de toutes les branches
        ]),
        'timeout' => 3.0        // Timeout court pour éviter les blocages
    ]);
```    

**Get events**

```php
    $eventsResponse = $this->httpClient->request('GET', "$gitlabUrl/api/v4/events", [
        'headers' => [
            'Authorization' => "Bearer $gitlabToken",
        ],
        'query' => [
            'per_page' => 5,
        ],
        'timeout' => 5,
    ]);
```

```php
    $response = $this->httpClient->request('GET', "$gitlabUrl/api/v4/projects/$projectId/repository/commits/$commitId", [
        'headers' => [
            'Authorization' => "Bearer $gitlabToken",
        ],
        'timeout' => 5,
    ]);

    $commitDetail = json_decode($response->getContent(), true);

    if ($commitDetail && isset($commitDetail['stats']) && is_array($commitDetail['stats'])) {
        return $commitDetail['stats'];
    }

    return $defaultStats;
```                