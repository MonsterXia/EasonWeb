import { standardEndpoint } from "../config/endpoint/standardEndpoint";
import gatewayManager from "../gatewayManager/gatewayManager";

const gatewayInstance = gatewayManager.getInstance();

interface BasicCheckResponse {
    message: string;
}
export const basicCheckAPI = async (): Promise<BasicCheckResponse> => {
    return await gatewayInstance.get<BasicCheckResponse>(gatewayInstance.buildStandardURL(standardEndpoint.healthCheck));
}