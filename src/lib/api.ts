import axios from 'axios'

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
    headers: {
      'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
    }
  })