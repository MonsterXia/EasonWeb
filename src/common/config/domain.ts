const standardDomain = import.meta.env.VITE_API_BASE_URL?.trim()
  || (import.meta.env.PROD ? 'https://api.246801357.xyz' : '/api')

export { standardDomain }
export default standardDomain
