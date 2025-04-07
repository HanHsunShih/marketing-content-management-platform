import axios from "axios";

const BACKEND_URL = "http://localhost:8000";

export const fetchPatent = async (documentNumber: number) => {
  return axios.get(`${BACKEND_URL}/document/${documentNumber}`);
};

export const savePatentAPI = async (
  documentNumber: number,
  content: string
) => {
  return axios.post(`${BACKEND_URL}/save/${documentNumber}`, { content });
};

export const createVersionAPI = async (
  documentNumber: number,
  content: string
) => {
  return axios.post(`${BACKEND_URL}/document/${documentNumber}/versions`, {
    content,
  });
};

export const fetchAllVersions = async () => {
  return axios.get(`${BACKEND_URL}/all-versions`);
};

export const fetchVersionContentAPI = async (
  documentNumber: number,
  versionNumber: number
) => {
  return axios.get(
    `${BACKEND_URL}/document/${documentNumber}/versions/${versionNumber}`
  );
};

export const saveVersionAPI = async (
  documentNumber: number,
  versionId: number,
  content: string
) => {
  return axios.post(
    `${BACKEND_URL}/save/${documentNumber}/version/${versionId}`,
    { content }
  );
};

export const deleteVersionAPI = async (
  patentParent: number,
  versionId: number
) => {
  return axios.delete(
    `${BACKEND_URL}/document/${patentParent}/versions/${versionId}`
  );
};
