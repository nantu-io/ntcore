import axios from 'axios';

const JSON_CONTENT_TYPE = { 'Content-Type': 'application/json' }

const getAuthHeader = () => {
  return (!window.localStorage) ? {} : {'Authorization': `Bearer ${window.localStorage.getItem('dspcolumbus_access_token')}`} 
}

export function fetchDataV1(url) {
  const headers = { headers: getAuthHeader() };
  return axios.get(url, headers)
}

export function postDataV1(url, content) {
  const headers = { headers: {...JSON_CONTENT_TYPE, ...getAuthHeader()} };
  return axios.post(url, content, headers)
}

export function putDataV1(url, content) {
  const headers = { headers: {...JSON_CONTENT_TYPE, ...getAuthHeader()} };
  return axios.put(url, content, headers)
}

export function deleteDataV1(url) {
  const headers = { headers: getAuthHeader() };
  return axios.delete(url, headers)
}