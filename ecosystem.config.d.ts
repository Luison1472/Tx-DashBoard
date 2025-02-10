export let apps: {
    name: string;
    script: string;
    instances: string;
    exec_mode: string;
    env: {
        NODE_ENV: string;
    };
}[];
