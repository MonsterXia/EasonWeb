import type { AxiosInstance } from "axios";
import request from "./axiosClient";
import standardDomain from "../config/domain";

class gatewayManager {
    private static _instance: gatewayManager;
    private _axiosInstance: AxiosInstance;

    private constructor() {
        this._axiosInstance = request;
    }

    public static getInstance(): gatewayManager {
        if (!gatewayManager._instance) {
            gatewayManager._instance = new gatewayManager();
        }
        return gatewayManager._instance;
    }

    public buildStandardURL(endpoint: string): string {
        return this.urlBuilder(standardDomain, endpoint);
    }

    private urlBuilder(baseURL: string, endpoint: string): string {
        if (!baseURL.endsWith('/')) {
            baseURL += '/';
        }

        if (endpoint.startsWith('/')) {
            endpoint = endpoint.substring(1);
        }

        return `${baseURL}${endpoint}`;
    }

    public async get<T>(url: string, params?: any, config?: any): Promise<T> {
        const response = await this._axiosInstance.get<T>(url, { params, ...config });
        return response.data;
    }

    public async post<T>(url: string, data?: any, config?: any): Promise<T> {
        const response = await this._axiosInstance.post<T>(url, data, config);
        return response.data;
    }

    public async put<T>(url: string, data?: any, config?: any): Promise<T> {
        const response = await this._axiosInstance.put<T>(url, data, config);
        return response.data;
    }

    public async delete<T>(url: string, config?: any): Promise<T> {
        const response = await this._axiosInstance.delete<T>(url, config);
        return response.data;
    }
}

export default gatewayManager;