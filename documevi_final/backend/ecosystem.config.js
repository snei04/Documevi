module.exports = {
    apps: [
        {
            name: "documevi-backend",
            script: "server.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: "production",
                // PORT: 4000 // Variable tomada de .env, pero se puede forzar aqui si es necesario
            },
            env_development: {
                NODE_ENV: "development",
            }
        }
    ]
};
