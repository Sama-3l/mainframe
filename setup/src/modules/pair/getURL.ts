export async function getTunnelUrl(metrics: string, timeoutMs= 60_000){
    const deadline = Date.now() + timeoutMs
    while(Date.now() < deadline){
        try{
            const isReady = await fetch(`${metrics}/ready`);
            if(isReady.ok) {
                const { hostname } = await (await fetch(`${metrics}/quicktunnel`)).json();
                if (/^[a-z0-9-]+\.trycloudflare\.com$/.test(hostname)) return `https://${hostname}`;      
            } 
        } catch { /* cloudflared not up yet */ }
            await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error("Tunnel not ready");
}