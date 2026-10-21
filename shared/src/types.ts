export interface QrPlayload{
    url: string,
    token: string,
    serverId: string,
};

export interface Token{
    id: string,
    token_hash: string, 
    expires_at: number,
    used_at: number,
    created_at: number
}

export interface PairingResult{
    deviceId: string,
    deviceToken: string
}

export interface Device{
    platform: "android" | "ios" | null;
    name: string,
    token_hash?: string;
}